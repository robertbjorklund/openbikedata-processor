import { TrailCategory } from "../format";
import { getTrailCategory } from "./TrailFormatter";

describe("getTrailCategory", () => {
  it("ignores urban cycleways", () => {
    expect(getTrailCategory({ highway: "cycleway" })).toBeNull();
  });

  it("classifies MTB trails by scale", () => {
    expect(
      getTrailCategory({ highway: "path", "mtb:scale": "2" }),
    ).toBe(TrailCategory.MtbTrail);
  });

  it("classifies designated paths and tracks without scale as MTB trails", () => {
    expect(
      getTrailCategory({ highway: "track", bicycle: "designated" }),
    ).toBe(TrailCategory.MtbTrail);
    expect(
      getTrailCategory({ highway: "path", bicycle: "designated" }),
    ).toBe(TrailCategory.MtbTrail);
    expect(getTrailCategory({ highway: "path", mtb: "yes" })).toBe(
      TrailCategory.MtbTrail,
    );
  });

  it("ignores generic paths that only allow cycling", () => {
    expect(getTrailCategory({ highway: "path", bicycle: "yes" })).toBeNull();
    expect(getTrailCategory({ highway: "path" })).toBeNull();
  });

  it("classifies designated footways and bridleways as shared paths", () => {
    expect(
      getTrailCategory({ highway: "footway", bicycle: "designated" }),
    ).toBe(TrailCategory.SharedPath);
    expect(
      getTrailCategory({ highway: "bridleway", bicycle: "designated" }),
    ).toBe(TrailCategory.SharedPath);
  });
});
