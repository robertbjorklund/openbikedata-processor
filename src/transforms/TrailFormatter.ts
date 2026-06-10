import length from "@turf/length";
import {
  FeatureType,
  SourceType,
  Status,
  TrailCategory,
  TrailProperties,
} from "../format";
import { osmID } from "../features/OSMGeoJSONProperties";
import { InputTrailFeature, OSMTrailTags } from "../features/TrailFeature";
import buildFeature from "./FeatureBuilder";
import { isValidGeometryInFeature } from "./GeoTransforms";
import {
  getOSMName,
  getOSMRef,
  mapOSMBoolean,
  mapOSMNumber,
  mapOSMString,
} from "./OSMTransforms";
import getStatusAndValue from "./Status";

type TrailPropsWithoutId = Omit<TrailProperties, "id">;

export function formatTrail(feature: InputTrailFeature) {
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
  if (isExcluded(tags)) {
    return [];
  }

  const category = getTrailCategory(tags);
  if (category === null) {
    return [];
  }

  const { status } = getStatusAndValue("highway", tags as Record<string, string>);
  if (status !== Status.Operating) {
    return [];
  }

  const ref = getOSMRef(tags);
  const baseProperties: TrailPropsWithoutId = {
    type: FeatureType.Trail,
    category,
    name: getOSMName(tags, "name"),
    ref,
    surface: mapOSMString(tags.surface),
    smoothness: mapOSMString(tags.smoothness),
    tracktype: mapOSMString(tags.tracktype),
    mtbScale: mapOSMNumber(tags["mtb:scale"]),
    sacScale: mapOSMString(tags.sac_scale),
    bicycle: mapOSMString(tags.bicycle),
    lit: mapOSMBoolean(tags.lit),
    oneway: mapOSMBoolean(tags.oneway),
    network: mapOSMString(tags.network),
    lengthMeters: null,
    status: status ?? Status.Operating,
    sources: [{ type: SourceType.OPENSTREETMAP, id: osmID(feature.properties) }],
  };

  if (feature.geometry.type === "MultiLineString") {
    return feature.geometry.coordinates.map((lineCoords) => {
      const geometry: GeoJSON.LineString = {
        type: "LineString",
        coordinates: lineCoords,
      };
      return buildTrailFeature(geometry, baseProperties);
    });
  }

  return [buildTrailFeature(feature.geometry, baseProperties)];
}

function buildTrailFeature(
  geometry: GeoJSON.LineString,
  properties: TrailPropsWithoutId,
) {
  const lengthMeters = Math.round(
    length({ type: "Feature", properties: {}, geometry }, { units: "meters" }),
  );
  return buildFeature(geometry, { ...properties, lengthMeters });
}

function isExcluded(tags: OSMTrailTags): boolean {
  if (tags.bicycle === "no" || tags.access === "private" || tags.access === "no") {
    return true;
  }
  if (tags.cycleway === "no") {
    return true;
  }
  return false;
}

export function getTrailCategory(tags: OSMTrailTags): TrailCategory | null {
  if (tags["mtb:scale"] !== undefined) {
    return TrailCategory.MtbTrail;
  }

  if (tags.highway === "cycleway" || hasDedicatedCycleway(tags)) {
    return TrailCategory.Cycleway;
  }

  if (tags.highway === "track") {
    return TrailCategory.GravelTrack;
  }

  if (
    tags.highway === "path" ||
    tags.highway === "bridleway" ||
    tags.highway === "footway" ||
    tags.highway === "service"
  ) {
    if (tags.bicycle === "designated" || tags.mtb === "yes") {
      return TrailCategory.MtbTrail;
    }
    return TrailCategory.SharedPath;
  }

  return null;
}

function hasDedicatedCycleway(tags: OSMTrailTags): boolean {
  return (
    (tags.cycleway !== undefined && tags.cycleway !== "no") ||
    tags["cycleway:lane"] !== undefined ||
    tags["cycleway:track"] !== undefined
  );
}
