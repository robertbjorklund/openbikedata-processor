import { FeatureType } from "../format";
import { formatRoute } from "./RouteFormatter";

describe("formatRoute", () => {
  it("keeps one feature per bicycle relation", () => {
    const features = formatRoute({
      type: "Feature",
      geometry: {
        type: "MultiLineString",
        coordinates: [
          [
            [18.0, 59.3],
            [18.1, 59.31],
          ],
          [
            [18.2, 59.32],
            [18.3, 59.33],
          ],
        ],
      },
      properties: {
        type: "relation",
        id: 103925,
        tags: {
          type: "route",
          route: "bicycle",
          name: "Sverigeleden",
          ref: "18",
          network: "ncn",
        },
      },
    });

    expect(features).toHaveLength(1);
    expect(features[0].geometry.type).toBe("MultiLineString");
    expect(features[0].properties.name).toBe("Sverigeleden");
    expect(features[0].properties.sources[0].id).toBe("relation/103925");
    expect(features[0].properties.id).toBe(features[0].properties.id);
    expect(features[0].properties.type).toBe(FeatureType.Route);
    expect(features[0].properties.osmRouteType).toBe("bicycle");
    expect(features[0].properties.osmColour).toBeNull();
    expect(features[0].properties.pavedRatio).toBeNull();
  });

  it("attaches paved ratio from member way surfaces", () => {
    const surfaceIndex = new Map([[42, 0.8]]);
    const features = formatRoute(
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [18.0, 59.3],
            [18.1, 59.31],
          ],
        },
        properties: {
          type: "relation",
          id: 42,
          tags: {
            type: "route",
            route: "bicycle",
            name: "Test route",
          },
        },
      },
      surfaceIndex,
    );

    expect(features[0].properties.pavedRatio).toBe(0.8);
  });

  it("keeps one feature per mtb route relation", () => {
    const features = formatRoute({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [13.05, 55.626],
          [13.06, 55.627],
        ],
      },
      properties: {
        type: "relation",
        id: 9856915,
        tags: {
          type: "route",
          route: "mtb",
          name: "Spillepengen Röd",
          colour: "red",
        },
      },
    });

    expect(features).toHaveLength(1);
    expect(features[0].properties.name).toBe("Spillepengen Röd");
    expect(features[0].properties.sources[0].id).toBe("relation/9856915");
    expect(features[0].properties.type).toBe(FeatureType.Route);
    expect(features[0].properties.osmRouteType).toBe("mtb");
    expect(features[0].properties.osmColour).toBe("red");
    expect(features[0].properties.network).toBeNull();
  });
});
