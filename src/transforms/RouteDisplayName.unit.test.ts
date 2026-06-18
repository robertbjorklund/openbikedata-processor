import {
  getRouteLinkKeys,
  isGenericRouteName,
  normalizeRouteName,
  parseRouteDisplayName,
} from "./RouteDisplayName";
import { FeatureType, RouteProperties, SourceType, Status } from "../format";

function routeProps(
  overrides: Partial<RouteProperties> & Pick<RouteProperties, "name" | "ref">,
): RouteProperties {
  return {
    type: FeatureType.Route,
    id: "test",
    groupId: null,
    stageId: null,
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
    sources: [{ type: SourceType.OPENSTREETMAP, id: "relation/1" }],
    ...overrides,
  };
}

describe("parseRouteDisplayName", () => {
  it("classifies leg parenthetical", () => {
    const parsed = parseRouteDisplayName(
      "Regionalt cykelnät Stockholm (Kymlingestråket)",
    );
    expect(parsed?.qualifierKind).toBe("leg");
    expect(parsed?.effectiveName).toBe(
      "regionalt cykelnät stockholm (kymlingestråket)",
    );
  });

  it("classifies stageRef parenthetical", () => {
    const parsed = parseRouteDisplayName("Sverigeleden (23)");
    expect(parsed?.qualifierKind).toBe("stageRef");
    expect(parsed?.qualifier).toBe("23");
    expect(parsed?.effectiveName).toBe("sverigeleden");
  });

  it("ignores annotation parenthetical", () => {
    const parsed = parseRouteDisplayName("Mälardalsleden (planerat)");
    expect(parsed?.qualifierKind).toBe("annotation");
    expect(parsed?.effectiveName).toBe("mälardalsleden");
  });
});

describe("normalizeRouteName", () => {
  it("returns effective name without stripping leg parenthetical", () => {
    expect(
      normalizeRouteName("Regionalt cykelnät Stockholm (Kymlingestråket)"),
    ).toBe("regionalt cykelnät stockholm (kymlingestråket)");
  });
});

describe("isGenericRouteName", () => {
  it("detects generic route names", () => {
    expect(isGenericRouteName("Bicycle Route")).toBe(true);
    expect(isGenericRouteName("Regionalt cykelnät X (Stråk A)")).toBe(false);
  });
});

describe("getRouteLinkKeys", () => {
  it("includes network in keys", () => {
    const keys = getRouteLinkKeys(
      routeProps({ name: "Sverigeleden", ref: "23", network: "ncn" }),
    );
    expect(keys).toContain("ref:bicycle:ncn:23");
    expect(keys).toContain("name:bicycle:ncn:sverigeleden");
  });
});
