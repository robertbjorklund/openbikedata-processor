import {
  FeatureType,
  RouteFeature,
  TrailFeature,
} from "../format";
import { trailColor } from "../format/MtbTrailColors";
import { routeNetworkColor } from "../format/RouteNetworkColors";

export interface MapboxGLTrailProperties {
  id: string;
  groupId: string | null;
  name: string | null;
  category: string;
  color: string;
  surface: string | null;
  mtbScale: number | null;
  mtbScaleImba: number | null;
  lengthMeters: number | null;
  network: string | null;
  /** OSM way/relation id for linking (e.g. way/12345) */
  osmId: string | null;
}

export interface MapboxGLRouteProperties {
  id: string;
  groupId: string | null;
  stageId: string | null;
  name: string | null;
  ref: string | null;
  from: string | null;
  to: string | null;
  via: string | null;
  network: string | null;
  color: string;
  pavedRatio: number | null;
  /** OSM relation/way id for linking (e.g. relation/103925) */
  osmId: string | null;
}

export function formatTrailForMapboxGL(
  feature: TrailFeature,
): GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString, MapboxGLTrailProperties> {
  const { properties } = feature;
  return {
    type: "Feature",
    geometry: feature.geometry,
    properties: {
      id: properties.id,
      groupId: properties.groupId,
      name: properties.name,
      category: properties.category,
      color: trailColor(properties.category, properties.mtbScale),
      surface: properties.surface,
      mtbScale: properties.mtbScale,
      mtbScaleImba: properties.mtbScaleImba,
      lengthMeters: properties.lengthMeters,
      network: properties.network,
      osmId: properties.sources[0]?.id ?? null,
    },
  };
}

export function formatRouteForMapboxGL(
  feature: RouteFeature,
): GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString, MapboxGLRouteProperties> {
  const { properties } = feature;
  return {
    type: "Feature",
    geometry: feature.geometry,
    properties: {
      id: properties.id,
      groupId: properties.groupId,
      stageId: properties.stageId,
      name: properties.name,
      ref: properties.ref,
      from: properties.from,
      to: properties.to,
      via: properties.via,
      network: properties.network,
      color: routeNetworkColor(properties.network),
      pavedRatio: properties.pavedRatio,
      osmId: properties.sources[0]?.id ?? null,
    },
  };
}

export function formatForMapboxGL(
  feature: TrailFeature | RouteFeature,
): GeoJSON.Feature {
  if (feature.properties.type === FeatureType.Trail) {
    return formatTrailForMapboxGL(feature as TrailFeature);
  }
  return formatRouteForMapboxGL(feature as RouteFeature);
}
