import { isSupportedOsmRoute, SUPPORTED_OSM_ROUTE_TAGS } from "./OsmRouteTypes";

describe("OsmRouteTypes", () => {
  it("accepts bicycle and mtb route relations", () => {
    expect(SUPPORTED_OSM_ROUTE_TAGS.has("bicycle")).toBe(true);
    expect(SUPPORTED_OSM_ROUTE_TAGS.has("mtb")).toBe(true);
    expect(isSupportedOsmRoute({ route: "bicycle" })).toBe(true);
    expect(isSupportedOsmRoute({ route: "mtb" })).toBe(true);
  });

  it("rejects other route types", () => {
    expect(isSupportedOsmRoute({ route: "hiking" })).toBe(false);
    expect(isSupportedOsmRoute({})).toBe(false);
  });
});
