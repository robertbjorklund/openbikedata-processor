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

  it("classifies designated gravel tracks", () => {
    expect(
      getTrailCategory({ highway: "track", bicycle: "designated" }),
    ).toBe(TrailCategory.GravelTrack);
  });

  it("ignores generic paths that only allow cycling", () => {
    expect(getTrailCategory({ highway: "path", bicycle: "yes" })).toBeNull();
    expect(getTrailCategory({ highway: "path" })).toBeNull();
  });

  it("classifies designated shared paths", () => {
    expect(
      getTrailCategory({ highway: "path", bicycle: "designated" }),
    ).toBe(TrailCategory.SharedPath);
  });
});
