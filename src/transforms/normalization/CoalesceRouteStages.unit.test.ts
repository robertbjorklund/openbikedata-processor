import {
  FeatureType,
  SourceType,
  Status,
  type RouteFeature,
} from "../../format";
import coalesceRouteStages from "./CoalesceRouteStages";
import {
  joinNearbyLineEnds,
  splitCoordsAtGaps,
} from "./routeGeometry";

function routeFeature(
  id: string,
  stageId: string,
  osmRelationId: string,
  name: string,
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString,
): RouteFeature {
  return {
    type: "Feature",
    geometry,
    properties: {
      type: FeatureType.Route,
      id,
      groupId: null,
      stageId,
      name,
      ref: null,
      from: null,
      to: null,
      via: null,
      network: null,
      osmRouteType: "mtb",
      osmColour: null,
      distance: null,
      roundtrip: true,
      pavedRatio: null,
      elevationProfile: null,
      status: Status.Operating,
      sources: [
        { type: SourceType.OPENSTREETMAP, id: `relation/${osmRelationId}` },
      ],
    },
  };
}

describe("routeGeometry", () => {
  it("splits lines at large coordinate gaps", () => {
    const lines = splitCoordsAtGaps([
      [12.0, 62.0],
      [12.0001, 62.0],
      [12.002, 62.0],
      [12.0021, 62.0],
    ]);

    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveLength(2);
    expect(lines[1]).toHaveLength(2);
  });

  it("joins line ends within tolerance", () => {
    const joined = joinNearbyLineEnds([
      [
        [0, 0],
        [0.001, 0],
      ],
      [
        [0.00105, 0],
        [0.002, 0],
      ],
    ]);

    expect(joined).toHaveLength(1);
    expect(joined[0].length).toBeGreaterThanOrEqual(3);
  });
});

describe("coalesceRouteStages", () => {
  it("merges split fragments of the same stage into one feature", () => {
    const stageId = "stage-2-milare";
    const features = coalesceRouteStages([
      routeFeature("topology-a", stageId, "12762423", "2 milare", {
        type: "LineString",
        coordinates: [
          [12.5295224, 62.7040058],
          [12.4416725, 62.6985493],
        ],
      }),
      routeFeature("topology-b", stageId, "12762423", "2 milare", {
        type: "LineString",
        coordinates: [
          [12.4417094, 62.6984975],
          [12.5294776, 62.7039992],
        ],
      }),
    ]);

    expect(features).toHaveLength(1);
    expect(features[0].properties.id).not.toBe("topology-a");
    expect(features[0].properties.id).not.toBe("topology-b");
    expect(features[0].properties.stageId).toBe(stageId);
    expect(features[0].geometry.type).toBe("LineString");
  });

  it("preserves OSM line geometry without splitting at way-boundary gaps", () => {
    const features = coalesceRouteStages([
      routeFeature("graniten", "stage-graniten", "12852252", "Graniten", {
        type: "LineString",
        coordinates: [
          [12.0, 62.0],
          [12.0001, 62.0],
          [12.002, 62.0],
          [12.0021, 62.0],
          [12.0022, 62.0],
        ],
      }),
    ]);

    expect(features).toHaveLength(1);
    expect(features[0].geometry.type).toBe("LineString");
    if (features[0].geometry.type === "LineString") {
      expect(features[0].geometry.coordinates).toHaveLength(5);
    }
  });
});
