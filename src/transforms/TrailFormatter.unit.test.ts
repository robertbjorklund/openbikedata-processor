import { TrailCategory } from "../format";
import { formatTrail, getTrailCategory } from "./TrailFormatter";

describe("formatTrail", () => {
  it("drops ways that belong to a signed route relation", () => {
    const feature = {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [13.05, 55.626],
          [13.051, 55.626],
        ],
      },
      properties: {
        type: "way",
        id: 42,
        tags: { highway: "path", "mtb:scale": "0" },
        relations: [{ rel: 9856915, reltags: { route: "mtb" } }],
      },
    };

    expect(formatTrail(feature)).toEqual([]);
    expect(formatTrail(feature, new Set([42]))).toEqual([]);
  });
});

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
