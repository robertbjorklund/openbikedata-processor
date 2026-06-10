import {
  FeatureType,
  RouteFeature,
  TRAIL_CATEGORY_COLORS,
  TrailFeature,
} from "../format";

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
      color: TRAIL_CATEGORY_COLORS[properties.category],
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
      color: networkColor(properties.network),
    },
  };
}

function networkColor(network: string | null): string {
  switch (network) {
    case "icn":
      return "#b71c1c";
    case "ncn":
      return "#c62828";
    case "rcn":
      return "#e65100";
    case "lcn":
      return "#2e7d32";
    default:
      return "#1565c0";
  }
}

export function formatForMapboxGL(
  feature: TrailFeature | RouteFeature,
): GeoJSON.Feature {
  if (feature.properties.type === FeatureType.Trail) {
    return formatTrailForMapboxGL(feature as TrailFeature);
  }
  return formatRouteForMapboxGL(feature as RouteFeature);
}
