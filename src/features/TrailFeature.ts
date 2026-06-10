import OSMGeoJSONProperties from "./OSMGeoJSONProperties";

export interface OSMTrailTags {
  highway?: string;
  cycleway?: string;
  "cycleway:lane"?: string;
  "cycleway:track"?: string;
  bicycle?: string;
  foot?: string;
  mtb?: string;
  "mtb:scale"?: string;
  sac_scale?: string;
  surface?: string;
  smoothness?: string;
  tracktype?: string;
  network?: string;
  lit?: string;
  oneway?: string;
  access?: string;
  name?: string;
  ref?: string;
  [key: string]: string | undefined;
}

export type InputTrailFeature = GeoJSON.Feature<
  GeoJSON.Geometry,
  OSMGeoJSONProperties<OSMTrailTags>
>;
