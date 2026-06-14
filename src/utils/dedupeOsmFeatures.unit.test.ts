import { dedupeOsmFeatures } from "./dedupeOsmFeatures";

describe("dedupeOsmFeatures", () => {
  it("removes duplicate relations by OSM id", () => {
    const feature = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
      properties: { type: "relation", id: 42, tags: { route: "bicycle" } },
    } satisfies GeoJSON.Feature;

    const result = dedupeOsmFeatures([feature, feature]);
    expect(result).toHaveLength(1);
    expect(result[0].properties?.id).toBe(42);
  });

  it("keeps distinct OSM objects", () => {
    const a = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
      properties: { type: "relation", id: 1, tags: {} },
    } satisfies GeoJSON.Feature;
    const b = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: [[2, 2], [3, 3]] },
      properties: { type: "relation", id: 2, tags: {} },
    } satisfies GeoJSON.Feature;

    expect(dedupeOsmFeatures([a, b])).toHaveLength(2);
  });
});
