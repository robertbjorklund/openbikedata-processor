import type { LineString, MultiLineString, Position } from "geojson";

export function getLineStringsFromGeometry(
  geometry: LineString | MultiLineString,
): LineString[] {
  if (geometry.type === "LineString") {
    return geometry.coordinates.length >= 2 ? [geometry] : [];
  }

  return geometry.coordinates
    .filter((line) => line.length >= 2)
    .map(
      (coordinates): LineString => ({
        type: "LineString",
        coordinates,
      }),
    );
}

export function concatenateLineStrings(
  geometries: Array<LineString | MultiLineString>,
): LineString | null {
  const coordinates: Position[] = [];

  for (const geometry of geometries) {
    for (const line of getLineStringsFromGeometry(geometry)) {
      for (const coord of line.coordinates) {
        appendCoordinate(coordinates, coord);
      }
    }
  }

  if (coordinates.length < 2) {
    return null;
  }

  return { type: "LineString", coordinates };
}

function appendCoordinate(coordinates: Position[], coord: Position): void {
  if (coordinates.length === 0) {
    coordinates.push([coord[0], coord[1]]);
    return;
  }

  const last = coordinates[coordinates.length - 1];
  if (last[0] === coord[0] && last[1] === coord[1]) {
    return;
  }

  coordinates.push([coord[0], coord[1]]);
}

export function profileSourceLine(
  geometry: LineString | MultiLineString,
): LineString | null {
  return concatenateLineStrings([geometry]);
}

export function supportsElevationProfileGeometry(
  geometry: GeoJSON.Geometry,
): geometry is LineString | MultiLineString {
  return geometry.type === "LineString" || geometry.type === "MultiLineString";
}
