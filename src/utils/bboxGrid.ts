import { readFile } from "node:fs/promises";
import { strict as assert } from "assert";

export interface BboxGridCell {
  name: string;
  bbox: GeoJSON.BBox;
}

function isBBox(value: unknown): value is GeoJSON.BBox {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((coordinate) => typeof coordinate === "number")
  );
}

function parseGridCell(value: unknown, index: number): BboxGridCell {
  if (isBBox(value)) {
    return { name: `cell-${index + 1}`, bbox: value };
  }

  assert(
    typeof value === "object" && value !== null,
    `Grid cell ${index + 1} must be a bbox or { name, bbox }`,
  );
  const cell = value as { name?: string; bbox?: unknown };
  assert(isBBox(cell.bbox), `Grid cell ${index + 1} has invalid bbox`);
  return {
    name: cell.name ?? `cell-${index + 1}`,
    bbox: cell.bbox,
  };
}

/** Grid for Overpass downloads (trails and routes when TRAILS_BBOX_GRID is set). */
export async function trailsGridFromEnvironment(): Promise<BboxGridCell[] | null> {
  const gridPath = process.env.TRAILS_BBOX_GRID ?? process.env.BBOX_GRID;
  if (!gridPath) {
    return null;
  }

  const raw = await readFile(gridPath, "utf-8");
  const parsed: unknown = JSON.parse(raw);
  assert(
    Array.isArray(parsed) && parsed.length > 0,
    "TRAILS_BBOX_GRID must be a non-empty array",
  );

  return parsed.map(parseGridCell);
}

/** @deprecated Use trailsGridFromEnvironment */
export const bboxGridFromEnvironment = trailsGridFromEnvironment;
