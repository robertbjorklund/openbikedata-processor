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



/** Drop unnamed short fragments (named trails always kept). */

const MIN_MTB_TRAIL_LENGTH_METERS = 200;



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

    elevationProfile: null,

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

        isTrailWorthy(feature.properties.lengthMeters, name, ref),

      );

  }



  const trail = buildTrailFeature(feature.geometry, baseProperties);

  return isTrailWorthy(trail.properties.lengthMeters, name, ref)

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

  if (tags.highway === "cycleway") {

    return true;

  }

  if (

    tags.highway === "footway" ||

    tags.highway === "bridleway" ||

    tags.highway === "pedestrian"

  ) {

    return true;

  }

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



  if (

    (tags.highway === "path" || tags.highway === "track") &&

    tags.mtb === "yes"

  ) {

    return TrailCategory.MtbTrail;

  }



  return null;

}



function isTrailWorthy(

  lengthMeters: number | null,

  name: string | null,

  ref: string | null,

): boolean {

  if (name || ref) {

    return true;

  }



  if (lengthMeters === null) {

    return false;

  }



  return lengthMeters >= MIN_MTB_TRAIL_LENGTH_METERS;

}


