import { TrailCategory } from "../format";
import { getTrailCategory } from "./TrailFormatter";

describe("getTrailCategory", () => {
  it("classifies cycleways", () => {
    expect(getTrailCategory({ highway: "cycleway" })).toBe(
      TrailCategory.Cycleway,
    );
  });

  it("classifies MTB trails by scale", () => {
    expect(
      getTrailCategory({ highway: "path", "mtb:scale": "2" }),
    ).toBe(TrailCategory.MtbTrail);
  });

  it("classifies gravel tracks", () => {
    expect(getTrailCategory({ highway: "track", bicycle: "yes" })).toBe(
      TrailCategory.GravelTrack,
    );
  });
});
