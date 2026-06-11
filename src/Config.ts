import { strict as assert } from "assert";

export type TileElevationServerConfig = {
  type: "tile";
  url: string;
  zoom: number[];
  tileEncoding: "mapbox" | "terrarium";
  tileSize: number;
  tileCacheDir: string;
  tileCacheMaxTiles: number;
  tileConcurrency: number;
  batchSize: number;
};

export type ElevationServerConfig = TileElevationServerConfig;

export type TilesConfig = { mbTilesPath: string; tilesDir: string };

const DEFAULT_TERRARIUM_URL =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
const DEFAULT_ELEVATION_ZOOM = [12, 13, 14];
const DEFAULT_ELEVATION_BATCH_SIZE = 10000;

export interface Config {
  bbox: GeoJSON.BBox | null;
  workingDir: string;
  outputDir: string;
  tiles: TilesConfig | null;
  elevationServer: ElevationServerConfig | null;
}

function parseZoom(): number[] {
  const raw = process.env.ELEVATION_SERVER_ZOOM;
  if (!raw) {
    return DEFAULT_ELEVATION_ZOOM;
  }
  return raw.split(",").map((z) => parseInt(z.trim(), 10));
}

function parseBatchSize(): number {
  const raw = process.env.ELEVATION_SERVER_BATCH_SIZE;
  return raw ? parseInt(raw, 10) : DEFAULT_ELEVATION_BATCH_SIZE;
}

function buildElevationServerConfig(url: string): ElevationServerConfig {
  const tileEncoding = (process.env.ELEVATION_SERVER_TILE_ENCODING ??
    (url.includes("terrarium") ? "terrarium" : "mapbox")) as
    | "mapbox"
    | "terrarium";

  return {
    type: "tile",
    url,
    zoom: parseZoom(),
    tileEncoding,
    tileSize: process.env.ELEVATION_TILE_SIZE
      ? parseInt(process.env.ELEVATION_TILE_SIZE, 10)
      : 256,
    tileCacheDir: process.env.ELEVATION_TILE_CACHE_DIR ?? "data/tile-cache",
    tileCacheMaxTiles: process.env.ELEVATION_TILE_CACHE_MAX_TILES
      ? parseInt(process.env.ELEVATION_TILE_CACHE_MAX_TILES, 10)
      : 100000,
    tileConcurrency: process.env.ELEVATION_TILE_CONCURRENCY
      ? parseInt(process.env.ELEVATION_TILE_CONCURRENCY, 10)
      : 4,
    batchSize: parseBatchSize(),
  };
}

export function configFromEnvironment(): Config {
  let bbox: GeoJSON.BBox | null = null;
  if (process.env.BBOX) {
    const parsed = JSON.parse(process.env.BBOX);
    assert(
      Array.isArray(parsed) &&
        parsed.length === 4 &&
        parsed.every((value) => typeof value === "number"),
    );
    bbox = parsed as GeoJSON.BBox;
  }

  const workingDir = process.env.WORKING_DIR ?? "data";
  const outputDir = process.env.OUTPUT_DIR ?? workingDir;

  const elevationEnabled = process.env.ENABLE_ELEVATION === "1";
  const elevationUrl =
    process.env.ELEVATION_SERVER_URL ??
    (elevationEnabled ? DEFAULT_TERRARIUM_URL : null);

  return {
    bbox,
    workingDir,
    outputDir,
    tiles:
      process.env.GENERATE_TILES === "1"
        ? {
            mbTilesPath: `${outputDir}/openbikemap.mbtiles`,
            tilesDir: `${outputDir}/openbikemap`,
          }
        : null,
    elevationServer: elevationUrl
      ? buildElevationServerConfig(elevationUrl)
      : null,
  };
}
