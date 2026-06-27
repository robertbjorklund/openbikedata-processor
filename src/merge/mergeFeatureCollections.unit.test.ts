import {
  mergeFeatureCollections,
  SALEN_REPLACE_BBOX,
  featureIntersectsBbox,
} from "./mergeFeatureCollections";

function lineFeature(
  id: string,
  coordinates: [number, number][],
): GeoJSON.Feature {
  return {
    type: "Feature",
    properties: { id },
    geometry: { type: "LineString", coordinates },
  };
}

describe("mergeFeatureCollections", () => {
  it("replaces base features inside the replace bbox with patch features", () => {
    const base = [
      lineFeature("old-in-salen", [
        [12.8, 61.12],
        [12.85, 61.14],
      ]),
      lineFeature("outside", [
        [18.0, 59.3],
        [18.1, 59.31],
      ]),
    ];
    const patch = [
      lineFeature("new-sherpa", [
        [12.81, 61.13],
        [12.86, 61.15],
      ]),
    ];

    const merged = mergeFeatureCollections(base, patch, SALEN_REPLACE_BBOX);

    expect(merged.map((feature) => feature.properties?.id)).toEqual([
      "outside",
      "new-sherpa",
    ]);
  });

  it("dedupes by id when no replace bbox is provided", () => {
    const base = [lineFeature("shared", [[1, 2]])];
    const patch = [lineFeature("shared", [[3, 4]])];

    const merged = mergeFeatureCollections(base, patch, null);

    expect(merged).toHaveLength(1);
    expect(merged[0].geometry).toEqual({
      type: "LineString",
      coordinates: [[3, 4]],
    });
  });
});

describe("featureIntersectsBbox", () => {
  it("detects overlap with salen bbox", () => {
    expect(
      featureIntersectsBbox(
        lineFeature("x", [
          [12.8, 61.1],
          [12.82, 61.11],
        ]),
        SALEN_REPLACE_BBOX,
      ),
    ).toBe(true);
  });
});
