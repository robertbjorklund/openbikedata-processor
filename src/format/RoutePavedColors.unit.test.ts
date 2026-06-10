import {
  routePavedColor,
  ROUTE_PAVED_COLOR_0_20,
  ROUTE_PAVED_COLOR_21_40,
  ROUTE_PAVED_COLOR_41_60,
  ROUTE_PAVED_COLOR_61_80,
  ROUTE_PAVED_COLOR_81_100,
  ROUTE_PAVED_COLOR_UNKNOWN,
} from "./RoutePavedColors";

describe("routePavedColor", () => {
  it("maps paved share buckets to the earth-to-gray gradient", () => {
    expect(routePavedColor(0)).toBe(ROUTE_PAVED_COLOR_0_20);
    expect(routePavedColor(0.2)).toBe(ROUTE_PAVED_COLOR_0_20);
    expect(routePavedColor(0.35)).toBe(ROUTE_PAVED_COLOR_21_40);
    expect(routePavedColor(0.5)).toBe(ROUTE_PAVED_COLOR_41_60);
    expect(routePavedColor(0.7)).toBe(ROUTE_PAVED_COLOR_61_80);
    expect(routePavedColor(0.9)).toBe(ROUTE_PAVED_COLOR_81_100);
  });

  it("uses neutral gray when paved share is unknown", () => {
    expect(routePavedColor(null)).toBe(ROUTE_PAVED_COLOR_UNKNOWN);
  });
});
