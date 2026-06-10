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

  const name = getOSMName(tags, "name");

  const { status } = getStatusAndValue("highway", tags as Record<string, string>);
  if (status !== Status.Operating) {
    return [];
  }

  const ref = getOSMRef(tags);
  const baseProperties: TrailPropsWithoutId = {
    type: FeatureType.Trail,
    category,
    name,
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
    return feature.geometry.coordinates
      .map((lineCoords) => {
        const geometry: GeoJSON.LineString = {
          type: "LineString",
          coordinates: lineCoords,
        };
        return buildTrailFeature(geometry, baseProperties);
      })
      .filter((feature) =>
        isTrailWorthy(category, feature.properties.lengthMeters, name, ref),
      );
  }

  const trail = buildTrailFeature(feature.geometry, baseProperties);
  return isTrailWorthy(category, trail.properties.lengthMeters, name, ref)
    ? [trail]
    : [];
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

  if (tags.highway === "cycleway") {
    return TrailCategory.Cycleway;
  }

  if (tags.highway === "track" && tags.bicycle === "designated") {
    return TrailCategory.GravelTrack;
  }

  if (
    (tags.highway === "path" ||
      tags.highway === "footway" ||
      tags.highway === "bridleway") &&
    tags.bicycle === "designated"
  ) {
    return TrailCategory.SharedPath;
  }

  return null;
}

const MIN_TRAIL_LENGTH_METERS: Partial<Record<TrailCategory, number>> = {
  [TrailCategory.SharedPath]: 50,
  [TrailCategory.GravelTrack]: 100,
};

function isTrailWorthy(
  category: TrailCategory,
  lengthMeters: number | null,
  name: string | null,
  ref: string | null,
): boolean {
  if (name || ref) {
    return true;
  }

  const minLength = MIN_TRAIL_LENGTH_METERS[category];
  if (minLength === undefined || lengthMeters === null) {
    return true;
  }

  return lengthMeters >= minLength;
}
