import { strict as assert } from "assert";

export default function overpassBBoxQuery(bbox: GeoJSON.BBox | null) {
  if (bbox === null) {
    return "";
  }
  assert(bbox.length === 4, "Only 2d boxes are supported");
  return `[bbox:${roundCoord(bbox[1])},${roundCoord(normalizeLongitude(bbox[0]))},${roundCoord(bbox[3])},${roundCoord(normalizeLongitude(bbox[2]))}]`;
}

function normalizeLongitude(longitude: number) {
  return ((longitude + 180) % 360) - 180;
}

function roundCoord(value: number) {
  return Math.round(value * 10000) / 10000;
}
