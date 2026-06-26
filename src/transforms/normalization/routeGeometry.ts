import distance from "@turf/distance";
import { point } from "@turf/helpers";

type LineCoords = GeoJSON.Position[];

/** Split a line where consecutive vertices are farther apart than this (removes OSM bridge segments). */
export const ROUTE_GAP_SPLIT_METERS = 75;

/** Join separate line ends within this distance (closes nearly-connected loops). */
export const ROUTE_ENDPOINT_JOIN_METERS = 10;

export function geometryToLines(
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString,
): LineCoords[] {
  if (geometry.type === "LineString") {
    return geometry.coordinates.length >= 2 ? [geometry.coordinates] : [];
  }
  return geometry.coordinates.filter((line) => line.length >= 2);
}

export function linesToGeometry(
  lines: LineCoords[],
): GeoJSON.LineString | GeoJSON.MultiLineString {
  if (lines.length === 0) {
    return { type: "LineString", coordinates: [] };
  }
  if (lines.length === 1) {
    return { type: "LineString", coordinates: lines[0] };
  }
  return { type: "MultiLineString", coordinates: lines };
}

function endpointDistanceMeters(a: GeoJSON.Position, b: GeoJSON.Position): number {
  return distance(point(a), point(b), { units: "meters" });
}

export function splitCoordsAtGaps(
  coords: LineCoords,
  maxGapMeters = ROUTE_GAP_SPLIT_METERS,
): LineCoords[] {
  if (coords.length < 2) {
    return [];
  }

  const lines: LineCoords[] = [];
  let current: LineCoords = [coords[0]];

  for (let index = 1; index < coords.length; index++) {
    const previous = coords[index - 1];
    const currentPoint = coords[index];
    const gap = endpointDistanceMeters(previous, currentPoint);

    if (gap > maxGapMeters) {
      if (current.length >= 2) {
        lines.push(current);
      }
      current = [currentPoint];
      continue;
    }

    current.push(currentPoint);
  }

  if (current.length >= 2) {
    lines.push(current);
  }

  return lines;
}

function concatLines(first: LineCoords, second: LineCoords, toleranceMeters: number): LineCoords {
  if (second.length === 0) {
    return first;
  }
  const skip =
    first.length > 0 &&
    endpointDistanceMeters(first[first.length - 1], second[0]) <= toleranceMeters
      ? 1
      : 0;
  return [...first, ...second.slice(skip)];
}

function tryMergeLines(
  left: LineCoords,
  right: LineCoords,
  toleranceMeters: number,
): LineCoords | null {
  if (left.length === 0) {
    return right;
  }
  if (right.length === 0) {
    return left;
  }

  const leftHead = left[0];
  const leftTail = left[left.length - 1];
  const rightHead = right[0];
  const rightTail = right[right.length - 1];

  if (endpointDistanceMeters(leftTail, rightHead) <= toleranceMeters) {
    return concatLines(left, right, toleranceMeters);
  }
  if (endpointDistanceMeters(leftTail, rightTail) <= toleranceMeters) {
    return concatLines(left, [...right].reverse(), toleranceMeters);
  }
  if (endpointDistanceMeters(leftHead, rightTail) <= toleranceMeters) {
    return concatLines(right, left, toleranceMeters);
  }
  if (endpointDistanceMeters(leftHead, rightHead) <= toleranceMeters) {
    return concatLines([...right].reverse(), left, toleranceMeters);
  }

  return null;
}

export function joinNearbyLineEnds(
  lines: LineCoords[],
  toleranceMeters = ROUTE_ENDPOINT_JOIN_METERS,
): LineCoords[] {
  let result = lines.filter((line) => line.length >= 2);

  let changed = true;
  while (changed) {
    changed = false;

    outer: for (let leftIndex = 0; leftIndex < result.length; leftIndex++) {
      for (let rightIndex = leftIndex + 1; rightIndex < result.length; rightIndex++) {
        const merged = tryMergeLines(
          result[leftIndex],
          result[rightIndex],
          toleranceMeters,
        );
        if (!merged) {
          continue;
        }

        result = [
          ...result.slice(0, leftIndex),
          ...result.slice(leftIndex + 1, rightIndex),
          ...result.slice(rightIndex + 1),
          merged,
        ];
        changed = true;
        break outer;
      }
    }
  }

  return result;
}

/** Join stage geometry for map display — does not split at OSM way gaps (that caused map fragmentation). */
export function normalizeRouteLines(
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString,
): LineCoords[] {
  return joinNearbyLineEnds(geometryToLines(geometry));
}
