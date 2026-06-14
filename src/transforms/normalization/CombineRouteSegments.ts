import objectHash from "object-hash";
import { stableFeatureId } from "../FeatureBuilder";
import {
  isPartOfSameRoute,
  mergedRouteProperties,
} from "./RouteJoining";
import PointGraph from "./PointGraph";
import type { RouteFeature, RouteProperties } from "../../format";

type RouteLineFeature = GeoJSON.Feature<GeoJSON.LineString, RouteProperties>;

function isDegenerateLineString(coords: GeoJSON.Position[]): boolean {
  return coords.length < 2 || coords.every((c) => c[0] === coords[0][0] && c[1] === coords[0][1]);
}

function toLineFeatures(feature: RouteFeature): RouteLineFeature[] {
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

function finalizeMergedRoute(feature: RouteLineFeature): RouteFeature {
  const properties: RouteProperties = {
    ...feature.properties,
    id: stableFeatureId("route-topology", objectHash(feature.geometry)),
  };
  return {
    type: "Feature",
    geometry: feature.geometry,
    properties,
  };
}

export default function combineRouteSegments(
  features: RouteFeature[],
): RouteFeature[] {
  const graph = new PointGraph<RouteProperties>(
    (left, right) => isPartOfSameRoute(left as RouteFeature, right as RouteFeature),
    mergedRouteProperties,
  );

  const lineFeatures: RouteLineFeature[] = [];

  for (const feature of features) {
    lineFeatures.push(...toLineFeatures(feature));
  }

  for (const line of lineFeatures) {
    graph.addFeature(line);
  }

  const merged: RouteFeature[] = [];
  for (const line of lineFeatures) {
    const combined = graph.merge(line);
    if (combined) {
      merged.push(finalizeMergedRoute(combined));
    }
  }

  return merged;
}
