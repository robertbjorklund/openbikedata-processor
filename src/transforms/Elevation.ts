import DataLoader from "dataloader";
import * as geohash from "ngeohash";
import {
  ElevationServerConfig,
} from "../Config";
import {
  extractPointsForElevationProfile,
  FeatureType,
} from "../format";
import { InMemoryCache } from "../utils/InMemoryCache";
import { TerrainTileElevationSource } from "./elevation/TerrainTileElevationSource";

const elevationProfileResolution = 25;
const ELEVATION_CACHE_TTL_MS = 365 * 24 * 60 * 60 * 1000;
const ERROR_LOG_THROTTLE_MS = 60000;

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

class ThrottledLogger {
  private lastLoggedErrors: Map<string, number> = new Map();

  log(errorKey: string, logFn: () => void): void {
    const now = Date.now();
    const lastLogged = this.lastLoggedErrors.get(errorKey);

    if (!lastLogged || now - lastLogged > ERROR_LOG_THROTTLE_MS) {
      logFn();
      this.lastLoggedErrors.set(errorKey, now);
    }
  }
}

const throttledLogger = new ThrottledLogger();

export interface ElevationProcessor {
  enhanceGeometry: (geometry: GeoJSON.Geometry) => Promise<void>;
  enhanceFeature: (feature: GeoJSON.Feature) => Promise<void>;
  close: () => Promise<void>;
}

function supportsElevationProfile(feature: GeoJSON.Feature): boolean {
  const type = feature.properties?.type;
  return (
    (type === FeatureType.Trail || type === FeatureType.Route) &&
    feature.geometry.type === "LineString"
  );
}

export async function createElevationProcessor(
  elevationServerConfig: ElevationServerConfig,
): Promise<ElevationProcessor> {
  const cache = new InMemoryCache<number | null>();
  await cache.initialize();

  let terrainTileSource: TerrainTileElevationSource | null = null;
  if (elevationServerConfig.type === "tile") {
    terrainTileSource = new TerrainTileElevationSource({
      urlTemplate: elevationServerConfig.url,
      encoding: elevationServerConfig.tileEncoding,
      tileSize: elevationServerConfig.tileSize,
      cacheDir: elevationServerConfig.tileCacheDir,
      cacheMaxTiles: elevationServerConfig.tileCacheMaxTiles,
      tileConcurrency: elevationServerConfig.tileConcurrency,
    });
    await terrainTileSource.initialize();
  }

  const elevationLoader = new DataLoader<string, number | null>(
    async (geohashes: readonly string[]) => {
      return await batchLoadElevations(
        Array.from(geohashes),
        elevationServerConfig,
        cache,
        terrainTileSource,
      );
    },
    {
      batch: true,
      maxBatchSize: elevationServerConfig.batchSize,
    },
  );

  const loadElevations = async (coordinates: number[][]): Promise<number[]> => {
    const geohashes = coordinates.map(([lng, lat]) =>
      geohash.encode(lat, lng, 10),
    );

    const elevationResults = await Promise.all(
      geohashes.map((hash) => elevationLoader.load(hash)),
    );

    return elevationResults.map((elevation) => {
      if (elevation === null) {
        throw new Error("No elevation data available");
      }
      return roundElevation(elevation);
    });
  };

  const enhanceGeometry = async (geometry: GeoJSON.Geometry): Promise<void> => {
    const coordinates: number[][] = getCoordinates(geometry);
    const elevations = await loadElevations(coordinates);
    addElevations(geometry, elevations);
  };

  const enhanceFeature = async (feature: GeoJSON.Feature): Promise<void> => {
    const geometry = feature.geometry;
    const elevationProfile = supportsElevationProfile(feature)
      ? extractPointsForElevationProfile(
          geometry as GeoJSON.LineString,
          elevationProfileResolution,
        )
      : null;

    try {
      const [, profileElevations] = await Promise.all([
        enhanceGeometry(geometry),
        loadElevations(elevationProfile?.geometry.coordinates || []),
      ]);

      if (supportsElevationProfile(feature) && feature.properties) {
        feature.properties.elevationProfile =
          profileElevations.length > 0
            ? {
                heights: profileElevations,
                resolution: elevationProfile!.resolutionInMeters,
                targetResolution: elevationProfileResolution,
              }
            : null;
      }
    } catch (error) {
      console.log("Failed to load elevations", error);
    }
  };

  const close = async (): Promise<void> => {
    if (terrainTileSource) {
      await terrainTileSource.close();
    }
    await cache.close();
  };

  return {
    enhanceFeature,
    enhanceGeometry,
    close,
  };
}

async function batchLoadElevations(
  geohashes: string[],
  elevationServerConfig: ElevationServerConfig,
  cache: InMemoryCache<number | null>,
  terrainTileSource: TerrainTileElevationSource | null,
): Promise<(number | null)[]> {
  const results: (number | null)[] = new Array(geohashes.length);
  const uncachedIndices: number[] = [];
  const uncachedCoordinates: number[][] = [];

  const cachedElevations = await cache.getMany(geohashes);

  for (let i = 0; i < geohashes.length; i++) {
    const cachedElevation = cachedElevations[i];
    if (cachedElevation !== undefined) {
      results[i] = cachedElevation;
    } else {
      uncachedIndices.push(i);
      const decoded = geohash.decode(geohashes[i]);
      uncachedCoordinates.push([decoded.latitude, decoded.longitude]);
    }
  }

  if (uncachedCoordinates.length === 0) {
    return results;
  }

  const fetchedElevations: Result<number | null, string>[] =
    await fetchElevationsFromServer(
      uncachedCoordinates,
      elevationServerConfig,
      terrainTileSource,
    );

  if (uncachedCoordinates.length !== fetchedElevations.length) {
    throw new Error(
      "Number of uncached coordinates (" +
        uncachedCoordinates.length +
        ") is different than number of fetched elevations (" +
        fetchedElevations.length +
        ")",
    );
  }

  const cacheEntries: Array<{ key: string; value: number | null }> = [];
  let errorCount = 0;

  for (let i = 0; i < uncachedIndices.length; i++) {
    const originalIndex = uncachedIndices[i];
    const result = fetchedElevations[i];
    const hash = geohashes[originalIndex];

    if (result.ok) {
      cacheEntries.push({ key: hash, value: result.value });
      results[originalIndex] = result.value;
    } else {
      errorCount++;
      throttledLogger.log(result.error, () => {
        console.warn(`Elevation fetch error: ${result.error}`);
      });
      results[originalIndex] = null;
    }
  }

  if (errorCount > 0) {
    throttledLogger.log("elevation-error-summary", () => {
      console.warn(
        `Failed to fetch elevation for ${errorCount} of ${fetchedElevations.length} coordinates`,
      );
    });
  }

  if (cacheEntries.length > 0) {
    await cache.setMany(cacheEntries);
  }

  return results;
}

async function fetchElevationsFromServer(
  coordinates: number[][],
  elevationServerConfig: ElevationServerConfig,
  terrainTileSource: TerrainTileElevationSource | null,
): Promise<Result<number | null, string>[]> {
  return await terrainTileSource!.fetchElevations(
    coordinates,
    elevationServerConfig.zoom,
  );
}

function getCoordinates(geometry: GeoJSON.Geometry): number[][] {
  let coordinates: number[][];
  const geometryType = geometry.type;
  switch (geometryType) {
    case "Point":
      coordinates = [geometry.coordinates];
      break;
    case "MultiPoint":
      coordinates = geometry.coordinates;
      break;
    case "LineString":
      coordinates = geometry.coordinates;
      break;
    case "MultiLineString":
      coordinates = geometry.coordinates.flat();
      break;
    case "Polygon":
      coordinates = geometry.coordinates.flat();
      break;
    case "MultiPolygon":
      coordinates = geometry.coordinates.flat(2);
      break;
    case "GeometryCollection":
      coordinates = geometry.geometries.flatMap((subGeometry) => {
        return getCoordinates(subGeometry);
      });
      break;
    default:
      const exhaustiveCheck: never = geometryType;
      throw "Geometry type " + exhaustiveCheck + " not implemented";
  }

  return coordinates.map((coordinate) => [coordinate[0], coordinate[1]]);
}

function addElevations(geometry: GeoJSON.Geometry, elevations: number[]) {
  let i = 0;
  const geometryType = geometry.type;
  switch (geometryType) {
    case "Point":
      return addElevationToCoords(geometry.coordinates, elevations[i]);
    case "MultiPoint":
      return geometry.coordinates.forEach((coords) => {
        addElevationToCoords(coords, elevations[i]);
        i++;
      });
    case "LineString":
      return geometry.coordinates.forEach((coords) => {
        addElevationToCoords(coords, elevations[i]);
        i++;
      });
    case "MultiLineString":
      return geometry.coordinates.forEach((coordsSet) => {
        coordsSet.forEach((coords) => {
          addElevationToCoords(coords, elevations[i]);
          i++;
        });
      });
    case "Polygon":
      return geometry.coordinates.forEach((coordsSet) => {
        coordsSet.forEach((coords) => {
          addElevationToCoords(coords, elevations[i]);
          i++;
        });
      });
    case "MultiPolygon":
      return geometry.coordinates.forEach((coordsSet) => {
        coordsSet.forEach((coordsArray) => {
          coordsArray.forEach((coords) => {
            addElevationToCoords(coords, elevations[i]);
            i++;
          });
        });
      });
    case "GeometryCollection":
      return geometry.geometries.forEach((subGeometry) => {
        addElevations(subGeometry, elevations.slice(i));
        i += getCoordinates(subGeometry).length;
      });
    default:
      const exhaustiveCheck: never = geometryType;
      throw "Geometry type " + exhaustiveCheck + " not implemented";
  }
}

function roundElevation(elevation: number): number {
  return Math.round(elevation * 10) / 10;
}

function addElevationToCoords(coords: number[], elevation: number) {
  if (coords.length === 3) {
    return;
  }

  coords.push(elevation);
}
