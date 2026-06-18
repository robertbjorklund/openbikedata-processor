/** OSM `route` values exported as OpenBikeMap route features. */
export const SUPPORTED_OSM_ROUTE_TAGS = new Set(["bicycle", "mtb"]);

export type OsmRouteType = "bicycle" | "mtb";

export function isSupportedOsmRoute(tags: { route?: string }): boolean {
  return tags.route !== undefined && SUPPORTED_OSM_ROUTE_TAGS.has(tags.route);
}
