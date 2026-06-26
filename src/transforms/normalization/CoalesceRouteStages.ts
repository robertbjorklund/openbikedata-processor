import length from "@turf/length";
import {
  FeatureType,
  RouteFeature,
  RouteProperties,
  Source,
} from "../../format";
import { stableFeatureId } from "../FeatureBuilder";
import {
  geometryToLines,
  joinNearbyLineEnds,
  linesToGeometry,
  normalizeRouteLines,
} from "./routeGeometry";

function uniqueSources(sources: Source[]): Source[] {
  const byId = new Map<string, Source>();
  for (const source of sources) {
    byId.set(`${source.type}:${source.id}`, source);
  }
  return [...byId.values()];
}

function routeGeometryMeters(feature: RouteFeature): number {
  return length(
    { type: "Feature", properties: {}, geometry: feature.geometry },
    { units: "meters" },
  );
}

function routeStableId(properties: RouteProperties): string {
  const osmSource = properties.sources.find((source) =>
    /^(relation|way|node)\//.test(source.id),
  );
  if (osmSource) {
    return stableFeatureId("route", osmSource.id);
  }
  if (properties.stageId) {
    return stableFeatureId("route", properties.stageId);
  }
  return properties.id;
}

function pickPrimarySegment(segments: RouteFeature[]): RouteFeature {
  return segments.reduce((best, segment) =>
    routeGeometryMeters(segment) > routeGeometryMeters(best) ? segment : best,
  );
}

function finalizeStageFeature(
  segments: RouteFeature[],
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString,
): RouteFeature {
  const primary = pickPrimarySegment(segments);
  const properties: RouteProperties = {
    ...primary.properties,
    type: FeatureType.Route,
    id: routeStableId(primary.properties),
    sources: uniqueSources(segments.flatMap((segment) => segment.properties.sources)),
  };

  return {
    type: "Feature",
    geometry,
    properties,
  };
}

function coalesceGeometry(
  segments: RouteFeature[],
): GeoJSON.LineString | GeoJSON.MultiLineString {
  const lines = joinNearbyLineEnds(
    segments.flatMap((segment) => geometryToLines(segment.geometry)),
  );
  return linesToGeometry(lines);
}

/** One output feature per OSM route stage (`stageId`), with gap-free geometry. */
export default function coalesceRouteStages(
  features: RouteFeature[],
): RouteFeature[] {
  const ungrouped: RouteFeature[] = [];
  const byStageId = new Map<string, RouteFeature[]>();

  for (const feature of features) {
    const stageId = feature.properties.stageId;
    if (!stageId) {
      ungrouped.push(
        finalizeStageFeature([feature], linesToGeometry(normalizeRouteLines(feature.geometry))),
      );
      continue;
    }

    const group = byStageId.get(stageId) ?? [];
    group.push(feature);
    byStageId.set(stageId, group);
  }

  const coalesced: RouteFeature[] = [...ungrouped];
  for (const segments of byStageId.values()) {
    coalesced.push(finalizeStageFeature(segments, coalesceGeometry(segments)));
  }

  return coalesced;
}
