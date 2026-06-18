import { FeatureType, SourceType, Status } from "../format";
import { formatRouteForMapboxGL } from "./MapboxGLFormatter";

describe("formatRouteForMapboxGL", () => {
  it("exports osmRouteType and MTB colour for route=mtb", () => {
    const feature = formatRouteForMapboxGL({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [13.05, 55.626],
          [13.06, 55.627],
        ],
      },
      properties: {
        type: FeatureType.Route,
        id: "route-1",
        groupId: null,
        stageId: "stage-1",
        name: "Spillepengen Röd",
        ref: null,
        from: null,
        to: null,
        via: null,
        network: null,
        osmRouteType: "mtb",
        osmColour: "red",
        distance: null,
        roundtrip: null,
        pavedRatio: null,
        elevationProfile: null,
        status: Status.Operating,
        sources: [{ type: SourceType.OPENSTREETMAP, id: "relation/9856915" }],
      },
    });

    expect(feature.properties.osmRouteType).toBe("mtb");
    expect(feature.properties.osmColour).toBe("red");
    expect(feature.properties.color).toBe("#d32f2f");
  });

  it("uses network colour for bicycle routes", () => {
    const feature = formatRouteForMapboxGL({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [18.0, 59.3],
          [18.1, 59.31],
        ],
      },
      properties: {
        type: FeatureType.Route,
        id: "route-2",
        groupId: null,
        stageId: "stage-2",
        name: "Sverigeleden",
        ref: "18",
        from: null,
        to: null,
        via: null,
        network: "ncn",
        osmRouteType: "bicycle",
        osmColour: null,
        distance: null,
        roundtrip: null,
        pavedRatio: null,
        elevationProfile: null,
        status: Status.Operating,
        sources: [{ type: SourceType.OPENSTREETMAP, id: "relation/103925" }],
      },
    });

    expect(feature.properties.osmRouteType).toBe("bicycle");
    expect(feature.properties.color).toBe("#d32f2f");
  });
});
