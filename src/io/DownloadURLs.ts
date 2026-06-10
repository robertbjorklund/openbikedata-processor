import overpassBBoxQuery from "../utils/overpassBBoxQuery";
import overpassTimeoutSeconds from "../utils/overpassTimeout";

export interface OSMDownloadConfig {
  query: (bbox: GeoJSON.BBox | null) => string;
}

/**
 * Designated cycling trails only — not every path or street that happens to allow bikes.
 * See https://wiki.openstreetmap.org/wiki/Key:bicycle
 */
export const trailsDownloadConfig: OSMDownloadConfig = {
  query: (bbox) => `
    [out:json][timeout:${overpassTimeoutSeconds()}]${overpassBBoxQuery(bbox)};
    (
      way[highway=cycleway];
      way[highway=path]["bicycle"="designated"]["access"!="private"];
      way[highway=path]["mtb:scale"]["access"!="private"];
      way[highway=track]["bicycle"="designated"]["access"!="private"];
      way[highway=track]["mtb:scale"]["access"!="private"];
      way[highway=footway]["bicycle"="designated"]["access"!="private"];
      way[highway=bridleway]["bicycle"="designated"]["access"!="private"];
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
    [out:json][timeout:${overpassTimeoutSeconds()}]${overpassBBoxQuery(bbox)};
    relation[route=bicycle];
    (._; >;);
    out;
    `,
};
