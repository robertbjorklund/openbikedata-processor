import {
  FeatureType,
  RouteFeature,
  TrailFeature,
} from "../format";
import { trailColor } from "../format/MtbTrailColors";
import { routePavedColor } from "../format/RoutePavedColors";

export interface MapboxGLTrailProperties {
  id: string;
  name: string | null;
  category: string;
  color: string;
  surface: string | null;
  mtbScale: number | null;
  lengthMeters: number | null;
  network: string | null;
}

export interface MapboxGLRouteProperties {
  id: string;
  name: string | null;
  ref: string | null;
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
      name: properties.name,
      category: properties.category,
      color: trailColor(properties.category, properties.mtbScale),
      surface: properties.surface,
      mtbScale: properties.mtbScale,
      lengthMeters: properties.lengthMeters,
      network: properties.network,
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
      name: properties.name,
      ref: properties.ref,
      network: properties.network,
      color: routePavedColor(properties.pavedRatio),
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
