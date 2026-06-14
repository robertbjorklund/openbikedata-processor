import overpassBBoxQuery from "../utils/overpassBBoxQuery";
import overpassTimeoutSeconds from "../utils/overpassTimeout";

export interface OSMDownloadConfig {
  query: (bbox: GeoJSON.BBox | null) => string;
}

/**
 * MTB trails only — not urban cycleways, footways, or generic designated paths.
 * Includes STS (mtb:scale) and IMBA (mtb:scale:imba) difficulty tags.
 * See https://wiki.openstreetmap.org/wiki/Key:mtb:scale
 */
export const trailsDownloadConfig: OSMDownloadConfig = {
  query: (bbox) => `
    [out:json][timeout:${overpassTimeoutSeconds()}]${overpassBBoxQuery(bbox)};
    (
      way[highway=path]["mtb:scale"]["access"!="private"];
      way[highway=path]["mtb:scale:imba"]["access"!="private"];
      way[highway=path]["mtb"="yes"]["access"!="private"];
      way[highway=track]["mtb:scale"]["access"!="private"];
      way[highway=track]["mtb:scale:imba"]["access"!="private"];
      way[highway=track]["mtb"="yes"]["access"!="private"];
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
