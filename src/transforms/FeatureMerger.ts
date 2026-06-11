import length from "@turf/length";
import {
  FeatureType,
  Source,
  TrailFeature,
  TrailProperties,
} from "../format";
import { stableFeatureId } from "./FeatureBuilder";

type LineCoords = GeoJSON.Position[];

function geometryToLines(
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString,
): LineCoords[] {
  if (geometry.type === "LineString") {
    return geometry.coordinates.length >= 2 ? [geometry.coordinates] : [];
  }
  return geometry.coordinates.filter((line) => line.length >= 2);
}

function linesToGeometry(
  lines: LineCoords[],
): GeoJSON.LineString | GeoJSON.MultiLineString {
  if (lines.length === 1) {
    return { type: "LineString", coordinates: lines[0] };
  }
  return { type: "MultiLineString", coordinates: lines };
}

function uniqueSources(sources: Source[]): Source[] {
  const byId = new Map<string, Source>();
  for (const source of sources) {
    byId.set(`${source.type}:${source.id}`, source);
  }
  return [...byId.values()];
}

export function getTrailGroupKey(properties: TrailProperties): string | null {
  if (properties.name) {
    return `name:${properties.name}|cat:${properties.category}`;
  }
  if (properties.ref) {
    return `ref:${properties.ref}|cat:${properties.category}`;
  }
  return null;
}

function mergeTrailGroup(
  groupKey: string,
  segments: TrailFeature[],
): TrailFeature {
  const lines = segments.flatMap((segment) => geometryToLines(segment.geometry));
  const geometry = linesToGeometry(lines);

  const primary = segments.reduce((best, segment) =>
    (segment.properties.lengthMeters ?? 0) > (best.properties.lengthMeters ?? 0)
      ? segment
      : best,
  );

  const totalLength = Math.round(
    length({ type: "Feature", properties: {}, geometry }, { units: "meters" }),
  );

  const properties: TrailProperties = {
    ...primary.properties,
    type: FeatureType.Trail,
    id: stableFeatureId("trail-group", groupKey),
    lengthMeters: totalLength,
    elevationProfile: null,
    sources: uniqueSources(segments.flatMap((segment) => segment.properties.sources)),
  };

  return {
    type: "Feature",
    geometry,
    properties,
  };
}

export function mergeTrailsByGroup(features: TrailFeature[]): TrailFeature[] {
  const ungrouped: TrailFeature[] = [];
  const groups = new Map<string, TrailFeature[]>();

  for (const feature of features) {
    const key = getTrailGroupKey(feature.properties);
    if (!key) {
      ungrouped.push(feature);
      continue;
    }
    const group = groups.get(key) ?? [];
    group.push(feature);
    groups.set(key, group);
  }

  const merged: TrailFeature[] = [...ungrouped];
  for (const [key, segments] of groups) {
    merged.push(
      segments.length === 1 ? segments[0] : mergeTrailGroup(key, segments),
    );
  }

  return merged;
}
