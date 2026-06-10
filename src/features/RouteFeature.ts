import OSMGeoJSONProperties from "./OSMGeoJSONProperties";

export interface OSMRouteTags {
  type?: string;
  route?: string;
  network?: string;
  name?: string;
  ref?: string;
  distance?: string;
  roundtrip?: string;
  [key: string]: string | undefined;
}

export type InputRouteFeature = GeoJSON.Feature<
  GeoJSON.Geometry,
  OSMGeoJSONProperties<OSMRouteTags>
>;
