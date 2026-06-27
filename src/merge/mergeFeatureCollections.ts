import type { BBox, Feature, Geometry, Position } from "geojson";

export const MERGE_GEOJSON_FILES = [
  "trails.geojson",
  "routes.geojson",
] as const;

export const SALEN_REPLACE_BBOX: BBox = [12.7, 61.05, 13.05, 61.25];

export function getFeatureId(feature: Feature): string | null {
  const id = feature.properties?.id;
  if (id === undefined || id === null || id === "") {
    return null;
  }
  return String(id);
}

function collectPositions(geometry: Geometry, positions: Position[]): void {
  switch (geometry.type) {
    case "Point":
      positions.push(geometry.coordinates);
      break;
    case "MultiPoint":
    case "LineString":
      positions.push(...geometry.coordinates);
      break;
    case "MultiLineString":
    case "Polygon":
      for (const ring of geometry.coordinates) {
        positions.push(...ring);
      }
      break;
    case "MultiPolygon":
      for (const polygon of geometry.coordinates) {
        for (const ring of polygon) {
          positions.push(...ring);
        }
      }
      break;
    case "GeometryCollection":
      for (const part of geometry.geometries) {
        collectPositions(part, positions);
      }
      break;
    default:
      break;
  }
}

export function featureBBox(feature: Feature): BBox | null {
  if (!feature.geometry) {
    return null;
  }

  const positions: Position[] = [];
  collectPositions(feature.geometry, positions);
  if (positions.length === 0) {
    return null;
  }

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const [lng, lat] of positions) {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      continue;
    }
    west = Math.min(west, lng);
    south = Math.min(south, lat);
    east = Math.max(east, lng);
    north = Math.max(north, lat);
  }

  if (!Number.isFinite(west)) {
    return null;
  }

  return [west, south, east, north];
}

export function bboxesIntersect(a: BBox, b: BBox): boolean {
  return !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);
}

export function featureIntersectsBbox(
  feature: Feature,
  bbox: BBox,
): boolean {
  const bounds = featureBBox(feature);
  return bounds !== null && bboxesIntersect(bounds, bbox);
}

/**
 * Merge a regional patch into a base dataset.
 * When replaceBbox is set, base features inside the bbox are dropped so the
 * patch fully replaces stale OSM geometry (feature ids change when geometry changes).
 */
export function mergeFeatureCollections(
  base: Feature[],
  patch: Feature[],
  replaceBbox: BBox | null,
): Feature[] {
  let keptBase = base;

  if (replaceBbox) {
    keptBase = base.filter(
      (feature) => !featureIntersectsBbox(feature, replaceBbox),
    );
  } else {
    const patchIds = new Set(
      patch.map(getFeatureId).filter((id): id is string => id !== null),
    );
    keptBase = base.filter((feature) => {
      const id = getFeatureId(feature);
      return id === null || !patchIds.has(id);
    });
  }

  return [...keptBase, ...patch];
}

export function parseReplaceBbox(value: string): BBox {
  const parsed: unknown = JSON.parse(value);
  if (
    !Array.isArray(parsed) ||
    parsed.length !== 4 ||
    !parsed.every((entry) => typeof entry === "number")
  ) {
    throw new Error(
      `Invalid --replace-bbox (expected GeoJSON bbox [west,south,east,north]): ${value}`,
    );
  }
  return parsed as BBox;
}
