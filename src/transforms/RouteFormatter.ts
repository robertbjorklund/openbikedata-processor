import {
  FeatureType,
  RouteProperties,
  SourceType,
  Status,
} from "../format";
import { osmID } from "../features/OSMGeoJSONProperties";
import { InputRouteFeature } from "../features/RouteFeature";
import { buildFeatureWithId, stableFeatureId } from "./FeatureBuilder";
import { isValidGeometryInFeature } from "./GeoTransforms";
import { getOSMName, getOSMRef, mapOSMBoolean, mapOSMString } from "./OSMTransforms";
import { RouteSurfaceIndex } from "./RouteSurfaceIndex";
import getStatusAndValue from "./Status";

type RoutePropsWithoutId = Omit<RouteProperties, "id" | "groupId" | "stageId">;

export function formatRoute(
  feature: InputRouteFeature,
  surfaceIndex: RouteSurfaceIndex = new Map(),
) {
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

  const osmRelationId = osmID(feature.properties);
  const stageId = stableFeatureId("route-stage", osmRelationId);

  const baseProperties: RoutePropsWithoutId = {
    type: FeatureType.Route,
    name: getOSMName(tags, "name"),
    ref: getOSMRef(tags),
    from: mapOSMString(tags.from),
    to: mapOSMString(tags.to),
    via: mapOSMString(tags.via),
    network: mapOSMString(tags.network),
    distance: mapOSMString(tags.distance),
    roundtrip: mapOSMBoolean(tags.roundtrip),
    pavedRatio: surfaceIndex.get(feature.properties.id) ?? null,
    elevationProfile: null,
    status: status ?? Status.Operating,
    sources: [{ type: SourceType.OPENSTREETMAP, id: osmID(feature.properties) }],
  };

  const routeId = stableFeatureId("route", osmID(feature.properties));

  return [
    buildFeatureWithId(
      feature.geometry,
      { ...baseProperties, groupId: null, stageId },
      routeId,
    ),
  ];
}
