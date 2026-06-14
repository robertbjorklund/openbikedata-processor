import {
  FeatureType,
  SourceType,
  Status,
  TrailCategory,
  type TrailFeature,
} from "../../format";
import combineTrailSegments from "./CombineTrailSegments";
import { assignTrailGroupIds } from "../AssignFeatureGroupIds";

function trail(
  id: string,
  name: string,
  coords: GeoJSON.Position[],
): TrailFeature {
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates: coords },
    properties: {
      type: FeatureType.Trail,
      id,
      groupId: null,
      category: TrailCategory.MtbTrail,
      name,
      ref: null,
      surface: "dirt",
      smoothness: null,
      tracktype: null,
      mtbScale: 2,
      mtbScaleImba: null,
      sacScale: null,
      bicycle: null,
      lit: false,
      oneway: null,
      network: null,
      lengthMeters: 100,
      elevationProfile: null,
      status: Status.Operating,
      sources: [{ type: SourceType.OPENSTREETMAP, id: `way/${id}` }],
    },
  };
}

describe("combineTrailSegments", () => {
  it("joins connected segments with matching properties", () => {
    const segments = [
      trail("a", "Connected trail", [[0, 0], [1, 0]]),
      trail("b", "Connected trail", [[1, 0], [2, 0]]),
    ];

    const combined = combineTrailSegments(segments);

    expect(combined).toHaveLength(1);
    expect(combined[0].geometry.type).toBe("LineString");
    expect(combined[0].geometry.coordinates).toHaveLength(3);
    expect(combined[0].properties.id).not.toBe("a");
  });

  it("keeps disconnected segments separate", () => {
    const segments = [
      trail("a", "Split trail", [[0, 0], [1, 0]]),
      trail("b", "Split trail", [[5, 5], [6, 5]]),
    ];

    const combined = combineTrailSegments(segments);

    expect(combined).toHaveLength(2);
  });
});

describe("assignTrailGroupIds", () => {
  it("assigns the same groupId to trails with the same name and category", () => {
    const features = assignTrailGroupIds([
      trail("a", "Mälardalsleden", [[0, 0], [1, 0]]),
      trail("b", "Mälardalsleden", [[2, 0], [3, 0]]),
      trail("c", "Other", [[4, 0], [5, 0]]),
    ]);

    const groupA = features[0].properties.groupId;
    const groupB = features[1].properties.groupId;
    expect(groupA).toBeTruthy();
    expect(groupA).toBe(groupB);
    expect(features[2].properties.groupId).not.toBe(groupA);
  });
});
