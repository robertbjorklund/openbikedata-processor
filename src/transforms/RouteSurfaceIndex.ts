import length from "@turf/length";
import { readAllFeatures } from "../io/GeoJSONRewrite";
import { isSupportedOsmRoute } from "./OsmRouteTypes";

const GRAVEL_SURFACES = new Set([
  "gravel",
  "compacted",
  "unpaved",
  "fine_gravel",
  "pebblestone",
  "dirt",
  "ground",
  "earth",
  "grass",
  "mud",
  "sand",
  "wood",
]);

const PAVED_SURFACES = new Set([
  "asphalt",
  "paved",
  "concrete",
  "paving_stones",
  "sett",
  "asphalt;tile",
  "cobblestone",
  "metal",
]);

type SurfaceTotals = { paved: number; unpaved: number };

export type RouteSurfaceIndex = Map<number, number>;

function classifySurface(surface: string | undefined): "paved" | "unpaved" | null {
  if (!surface) {
    return null;
  }
  if (PAVED_SURFACES.has(surface)) {
    return "paved";
  }
  if (GRAVEL_SURFACES.has(surface)) {
    return "unpaved";
  }
  return null;
}

function lineLengthMeters(geometry: GeoJSON.LineString | GeoJSON.MultiLineString): number {
  return length({ type: "Feature", properties: {}, geometry }, { units: "meters" });
}

export async function buildRouteSurfaceIndex(
  inputRoutesPath: string,
): Promise<RouteSurfaceIndex> {
  const features = await readAllFeatures(inputRoutesPath);
  const totalsByRelation = new Map<number, SurfaceTotals>();

  for (const feature of features) {
    const properties = feature.properties as {
      tags?: { highway?: string; surface?: string };
      relations?: Array<{
        rel: number;
        reltags?: { route?: string };
      }>;
    };

    if (!properties.tags?.highway || !properties.relations?.length) {
      continue;
    }

    const geometry = feature.geometry;
    if (geometry.type !== "LineString" && geometry.type !== "MultiLineString") {
      continue;
    }

    const surfaceClass = classifySurface(properties.tags.surface);
    if (!surfaceClass) {
      continue;
    }

    const segmentMeters = lineLengthMeters(geometry);
    if (segmentMeters <= 0) {
      continue;
    }

    for (const relation of properties.relations) {
      if (!relation.reltags || !isSupportedOsmRoute(relation.reltags)) {
        continue;
      }

      const totals = totalsByRelation.get(relation.rel) ?? {
        paved: 0,
        unpaved: 0,
      };
      if (surfaceClass === "paved") {
        totals.paved += segmentMeters;
      } else {
        totals.unpaved += segmentMeters;
      }
      totalsByRelation.set(relation.rel, totals);
    }
  }

  const index: RouteSurfaceIndex = new Map();
  for (const [relationId, totals] of totalsByRelation) {
    const classified = totals.paved + totals.unpaved;
    if (classified <= 0) {
      continue;
    }
    index.set(relationId, totals.paved / classified);
  }

  return index;
}
