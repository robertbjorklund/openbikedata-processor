import { TrailCategory } from "../format";
import { getTrailCategory } from "./TrailFormatter";

describe("getTrailCategory", () => {
  it("ignores urban cycleways", () => {
    expect(getTrailCategory({ highway: "cycleway" })).toBeNull();
  });

  it("ignores footways and bridleways", () => {
    expect(
      getTrailCategory({ highway: "footway", bicycle: "designated" }),
    ).toBeNull();
    expect(
      getTrailCategory({ highway: "bridleway", bicycle: "designated" }),
    ).toBeNull();
  });

  it("classifies MTB trails by STS scale", () => {
    expect(
      getTrailCategory({ highway: "path", "mtb:scale": "2" }),
    ).toBe(TrailCategory.MtbTrail);
  });

  it("classifies MTB trails by IMBA scale", () => {
    expect(
      getTrailCategory({ highway: "path", "mtb:scale:imba": "2" }),
    ).toBe(TrailCategory.MtbTrail);
  });

  it("classifies paths and tracks with mtb=yes", () => {
    expect(getTrailCategory({ highway: "path", mtb: "yes" })).toBe(
      TrailCategory.MtbTrail,
    );
    expect(getTrailCategory({ highway: "track", mtb: "yes" })).toBe(
      TrailCategory.MtbTrail,
    );
  });

  it("ignores designated paths without mtb difficulty tags", () => {
    expect(
      getTrailCategory({ highway: "track", bicycle: "designated" }),
    ).toBeNull();
    expect(
      getTrailCategory({
        highway: "path",
        bicycle: "designated",
        "mtb:type": "downhill",
      }),
    ).toBeNull();
  });

  it("ignores generic paths that only allow cycling", () => {
    expect(getTrailCategory({ highway: "path", bicycle: "yes" })).toBeNull();
    expect(getTrailCategory({ highway: "path" })).toBeNull();
  });
});
