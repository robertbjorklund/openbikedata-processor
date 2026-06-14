import length from "@turf/length";
import objectHash from "object-hash";
import { stableFeatureId } from "../FeatureBuilder";
import {
  isPartOfSameTrail,
  mergedTrailProperties,
} from "./TrailJoining";
import PointGraph from "./PointGraph";
import type { TrailFeature, TrailProperties } from "../../format";

type TrailLineFeature = GeoJSON.Feature<GeoJSON.LineString, TrailProperties>;

function isDegenerateLineString(coords: GeoJSON.Position[]): boolean {
  return coords.length < 2 || coords.every((c) => c[0] === coords[0][0] && c[1] === coords[0][1]);
}

function toLineFeatures(feature: TrailFeature): TrailLineFeature[] {
  if (feature.geometry.type === "LineString") {
    return isDegenerateLineString(feature.geometry.coordinates)
      ? []
      : [
          {
            type: "Feature",
            geometry: feature.geometry,
            properties: feature.properties,
          },
        ];
  }
  return feature.geometry.coordinates
    .filter((line) => !isDegenerateLineString(line))
    .map((coordinates) => ({
      type: "Feature",
      geometry: { type: "LineString", coordinates },
      properties: feature.properties,
    }));
}

function finalizeMergedTrail(feature: TrailLineFeature): TrailFeature {
  const lengthMeters = Math.round(
    length(
      { type: "Feature", properties: {}, geometry: feature.geometry },
      { units: "meters" },
    ),
  );
  const properties: TrailProperties = {
    ...feature.properties,
    id: stableFeatureId("trail-topology", objectHash(feature.geometry)),
    lengthMeters,
  };
  return {
    type: "Feature",
    geometry: feature.geometry,
    properties,
  };
}

export default function combineTrailSegments(
  features: TrailFeature[],
): TrailFeature[] {
  const graph = new PointGraph<TrailProperties>(
    (left, right) => isPartOfSameTrail(left as TrailFeature, right as TrailFeature),
    mergedTrailProperties,
  );

  const lineFeatures: TrailLineFeature[] = [];
  const nonLines: TrailFeature[] = [];

  for (const feature of features) {
    if (feature.geometry.type === "LineString" || feature.geometry.type === "MultiLineString") {
      lineFeatures.push(...toLineFeatures(feature));
    } else {
      nonLines.push(feature);
    }
  }

  for (const line of lineFeatures) {
    graph.addFeature(line);
  }

  const merged: TrailFeature[] = [...nonLines];
  for (const line of lineFeatures) {
    const combined = graph.merge(line);
    if (combined) {
      merged.push(finalizeMergedTrail(combined));
    }
  }

  return merged;
}
