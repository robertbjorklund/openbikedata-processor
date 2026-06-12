import {
  FeatureType,
  RouteFeature,
  SourceType,
  Status,
  TrailCategory,
  TrailFeature,
} from "../format";
import {
  getRouteGroupKey,
  getTrailGroupKey,
  mergeRoutesByGroup,
  mergeTrailsByGroup,
} from "./FeatureMerger";

function trail(
  id: string,
  name: string | null,
  coords: GeoJSON.Position[][],
  lengthMeters: number,
): TrailFeature {
  const geometry =
    coords.length === 1
      ? { type: "LineString" as const, coordinates: coords[0] }
      : { type: "MultiLineString" as const, coordinates: coords };

  return {
    type: "Feature",
    geometry,
    properties: {
      type: FeatureType.Trail,
      id,
      category: TrailCategory.MtbTrail,
      name,
      ref: null,
      surface: "dirt",
      smoothness: null,
      tracktype: null,
      mtbScale: 2,
      sacScale: null,
      bicycle: null,
      lit: false,
      oneway: null,
      network: null,
      lengthMeters,
      elevationProfile: null,
      status: Status.Operating,
      sources: [{ type: SourceType.OPENSTREETMAP, id: `way/${id}` }],
    },
  };
}

describe("mergeTrailsByGroup", () => {
  it("groups trails with the same name and category", () => {
    const features = mergeTrailsByGroup([
      trail("a", "Judarskogen Reflexbana MTB", [[[0, 0], [1, 1]]], 1000),
      trail("b", "Judarskogen Reflexbana MTB", [[[2, 2], [3, 3]]], 2000),
      trail("c", "Other trail", [[[4, 4], [5, 5]]], 500),
    ]);

    expect(features).toHaveLength(2);
    const grouped = features.find(
      (feature) => feature.properties.name === "Judarskogen Reflexbana MTB",
    );
    expect(grouped?.geometry.type).toBe("MultiLineString");
    expect(grouped?.properties.sources).toHaveLength(2);
    expect(grouped?.properties.lengthMeters).toBeGreaterThan(0);
  });

  it("leaves unnamed trails unmerged", () => {
    const features = mergeTrailsByGroup([
      trail("a", null, [[[0, 0], [1, 1]]], 100),
      trail("b", null, [[[2, 2], [3, 3]]], 100),
    ]);

    expect(features).toHaveLength(2);
  });
});

function route(
  id: string,
  name: string | null,
  ref: string | null,
  coords: GeoJSON.Position[][],
): RouteFeature {
  const geometry =
    coords.length === 1
      ? { type: "LineString" as const, coordinates: coords[0] }
      : { type: "MultiLineString" as const, coordinates: coords };

  return {
    type: "Feature",
    geometry,
    properties: {
      type: FeatureType.Route,
      id,
      name,
      ref,
      network: "lcn",
      distance: null,
      roundtrip: null,
      pavedRatio: null,
      elevationProfile: null,
      status: Status.Operating,
      sources: [{ type: SourceType.OPENSTREETMAP, id: `relation/${id}` }],
    },
  };
}

describe("mergeRoutesByGroup", () => {
  it("groups routes with the same normalized name", () => {
    const features = mergeRoutesByGroup([
      route("a", "Kustlinjen (29)", null, [[[0, 0], [1, 1]]]),
      route("b", "Kustlinjen", "29", [[[2, 2], [3, 3]]]),
      route("c", "Other route", null, [[[4, 4], [5, 5]]]),
    ]);

    expect(features).toHaveLength(2);
    const grouped = features.find(
      (feature) => feature.properties.name === "Kustlinjen (29)",
    );
    expect(grouped?.geometry.type).toBe("MultiLineString");
    expect(grouped?.properties.sources).toHaveLength(2);
  });

  it("groups routes with the same ref when unnamed", () => {
    const features = mergeRoutesByGroup([
      route("a", null, "29", [[[0, 0], [1, 1]]]),
      route("b", null, "29", [[[2, 2], [3, 3]]]),
    ]);

    expect(features).toHaveLength(1);
    expect(features[0].geometry.type).toBe("MultiLineString");
  });

  it("groups named and ref-only segments that share ref", () => {
    const features = mergeRoutesByGroup([
      route("a", "Kustlinjen", "29", [[[0, 0], [1, 1]]]),
      route("b", null, "29", [[[2, 2], [3, 3]]]),
      route("c", "Unrelated", "99", [[[4, 4], [5, 5]]]),
    ]);

    expect(features).toHaveLength(2);
    const grouped = features.find((feature) => feature.properties.ref === "29");
    expect(grouped?.geometry.type).toBe("MultiLineString");
    expect(grouped?.properties.sources).toHaveLength(2);
    expect(grouped?.properties.id).not.toBe("a");
  });
});

describe("getRouteGroupKey", () => {
  it("normalizes parenthetical route names", () => {
    expect(
      getRouteGroupKey({
        type: FeatureType.Route,
        id: "x",
        name: "Kustlinjen (29)",
        ref: null,
        network: "lcn",
        distance: null,
        roundtrip: null,
        pavedRatio: null,
        elevationProfile: null,
        status: Status.Operating,
        sources: [],
      }),
    ).toBe("name:kustlinjen");
  });
});

describe("getTrailGroupKey", () => {
  it("uses name and category", () => {
    expect(
      getTrailGroupKey({
        type: FeatureType.Trail,
        id: "x",
        category: TrailCategory.MtbTrail,
        name: "Test",
        ref: null,
        surface: null,
        smoothness: null,
        tracktype: null,
        mtbScale: null,
        sacScale: null,
        bicycle: null,
        lit: null,
        oneway: null,
        network: null,
        lengthMeters: null,
        elevationProfile: null,
        status: Status.Operating,
        sources: [],
      }),
    ).toBe("name:Test|cat:mtb_trail");
  });
});
