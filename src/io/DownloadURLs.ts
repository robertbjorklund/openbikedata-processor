import overpassBBoxQuery from "../utils/overpassBBoxQuery";

export interface OSMDownloadConfig {
  query: (bbox: GeoJSON.BBox | null) => string;
}

/**
 * Bicycle infrastructure: cycleways, paths/tracks open to cycling, MTB trails.
 * See https://wiki.openstreetmap.org/wiki/Key:bicycle
 */
export const trailsDownloadConfig: OSMDownloadConfig = {
  query: (bbox) => `
    [out:json][timeout:1800]${overpassBBoxQuery(bbox)};
    (
      way[highway=cycleway];
      way[cycleway][cycleway!=no];
      way["cycleway:lane"];
      way["cycleway:track"];
      way["cycleway:opposite"];
      way[highway=path]["bicycle"!="no"]["access"!="private"];
      way[highway=track]["bicycle"!="no"]["access"!="private"];
      way[highway=bridleway]["bicycle"!="no"]["access"!="private"];
      way[highway=path]["mtb:scale"];
      way[highway=track]["mtb:scale"];
      way[highway=footway]["bicycle"~"designated|yes"];
      way[highway=service]["bicycle"~"designated|yes"];
    );
    (._; >;);
    out;
    `,
};

/**
 * Signed bicycle route relations (lcn/ncn/rcn/icn and local networks).
 */
export const routesDownloadConfig: OSMDownloadConfig = {
  query: (bbox) => `
    [out:json][timeout:1800]${overpassBBoxQuery(bbox)};
    relation[route=bicycle];
    (._; >;);
    out;
    `,
};
