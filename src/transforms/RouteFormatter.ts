import {
  FeatureType,
  RouteProperties,
  SourceType,
  Status,
} from "../format";
import { osmID } from "../features/OSMGeoJSONProperties";
import { InputRouteFeature } from "../features/RouteFeature";
import buildFeature from "./FeatureBuilder";
import { isValidGeometryInFeature } from "./GeoTransforms";
import { getOSMName, getOSMRef, mapOSMBoolean, mapOSMString } from "./OSMTransforms";
import getStatusAndValue from "./Status";

type RoutePropsWithoutId = Omit<RouteProperties, "id">;

export function formatRoute(feature: InputRouteFeature) {
  if (
    feature.geometry.type !== "LineString" &&
    feature.geometry.type !== "MultiLineString"
  ) {
    return [];
  }

  if (!isValidGeometryInFeature(feature)) {
    return [];
  }

  const tags = feature.properties.tags;
  if (tags.route !== "bicycle") {
    return [];
  }

  const { status } = getStatusAndValue("route", tags as Record<string, string>);
  if (status !== Status.Operating) {
    return [];
  }

  const baseProperties: RoutePropsWithoutId = {
    type: FeatureType.Route,
    name: getOSMName(tags, "name"),
    ref: getOSMRef(tags),
    network: mapOSMString(tags.network),
    distance: mapOSMString(tags.distance),
    roundtrip: mapOSMBoolean(tags.roundtrip),
    status: status ?? Status.Operating,
    sources: [{ type: SourceType.OPENSTREETMAP, id: osmID(feature.properties) }],
  };

  if (feature.geometry.type === "MultiLineString") {
    return feature.geometry.coordinates.map((lineCoords) => {
      const geometry: GeoJSON.LineString = {
        type: "LineString",
        coordinates: lineCoords,
      };
      return buildFeature(geometry, baseProperties);
    });
  }

  return [buildFeature(feature.geometry, baseProperties)];
}
