import objectHash from "object-hash";
import { FeatureType } from "../format";

export default function buildFeature<
  G extends GeoJSON.Geometry,
  P extends { type: FeatureType },
>(geometry: G, properties: P): GeoJSON.Feature<G, P & { id: string }> {
  const id = objectHash({
    type: "Feature",
    properties: { type: properties.type },
    geometry,
  });

  return {
    type: "Feature",
    properties: { ...properties, id },
    geometry,
  };
}
