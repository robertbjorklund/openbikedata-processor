import { mtbRouteColor, parseOsmColour } from "./MtbRouteColors";

describe("parseOsmColour", () => {
  it("maps named OSM colours", () => {
    expect(parseOsmColour("red")).toBe("#d32f2f");
    expect(parseOsmColour("Blue")).toBe("#1565c0");
  });

  it("accepts hex values", () => {
    expect(parseOsmColour("#abc")).toBe("#abc");
  });

  it("returns null for unknown values", () => {
    expect(parseOsmColour("chartreuse")).toBeNull();
  });
});

describe("mtbRouteColor", () => {
  it("uses OSM colour when known", () => {
    expect(mtbRouteColor("red")).toBe("#d32f2f");
  });

  it("falls back to default brown", () => {
    expect(mtbRouteColor(null)).toBe("#795548");
  });
});
