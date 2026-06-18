/**
 * Target behaviour for route link keys (docs/ROUTE-GROUPING.md).
 * Enable this suite when getRouteLinkKeys is updated to match the spec.
 */
import {
  FeatureType,
  RouteProperties,
  SourceType,
  Status,
} from "../format";
import { assignRouteGroupIds } from "./AssignFeatureGroupIds";
import { getRouteLinkKeys } from "./RouteDisplayName";

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

function routeFeature(
  id: string,
  name: string | null,
  ref: string | null,
  network = "ncn",
) {
  return {
    type: "Feature" as const,
    geometry: {
      type: "LineString" as const,
      coordinates: [
        [0, 0],
        [1, 1],
      ],
    },
    properties: routeProps({ id, name, ref, network }),
  };
}

function sameGroup(
  features: ReturnType<typeof assignRouteGroupIds>,
  a: number,
  b: number,
): boolean {
  const ga = features[a].properties.groupId;
  const gb = features[b].properties.groupId;
  return !!ga && ga === gb;
}

describe("Route link keys (ROUTE-GROUPING.md spec)", () => {
  describe("getRouteLinkKeys", () => {
    it("uses full name for leg qualifier — no shared base-only key", () => {
      const keys = getRouteLinkKeys(
        routeProps({
          name: "Regionalt cykelnät Stockholm (Kymlingestråket)",
          ref: null,
          network: "rcn",
        }),
      );
      expect(keys).toContain(
        "leg:bicycle:rcn:regionalt cykelnät stockholm:kymlingestråket",
      );
      expect(keys).toContain(
        "name:bicycle:rcn:regionalt cykelnät stockholm (kymlingestråket)",
      );
      expect(keys.some((k) => k === "name:bicycle:rcn:regionalt cykelnät stockholm")).toBe(
        false,
      );
    });

    it("links stageRef in name with ref tag via ref key", () => {
      const fromName = getRouteLinkKeys(
        routeProps({ name: "Sverigeleden (23)", ref: null, network: "ncn" }),
      );
      const fromRef = getRouteLinkKeys(
        routeProps({ name: "Sverigeleden", ref: "23", network: "ncn" }),
      );
      expect(fromName).toContain("ref:bicycle:ncn:23");
      expect(fromRef).toContain("ref:bicycle:ncn:23");
    });

    it("does not emit rcn ref-only key when qualifier is leg", () => {
      const keys = getRouteLinkKeys(
        routeProps({
          name: "Regionalt cykelnät X (Stråk A)",
          ref: "1",
          network: "rcn",
        }),
      );
      expect(keys.some((k) => k === "ref:bicycle:rcn:1")).toBe(false);
    });

    it("strips annotation parenthetical for effective name", () => {
      const keys = getRouteLinkKeys(
        routeProps({
          name: "Mälardalsleden (planerat)",
          ref: null,
          network: "rcn",
        }),
      );
      expect(keys).toContain("name:bicycle:rcn:mälardalsleden");
      expect(
        keys.some((k) => k.includes("planerat")),
      ).toBe(false);
    });
  });

  describe("assignRouteGroupIds", () => {
    it("groups Sverigeleden name suffix with ref tag", () => {
      const features = assignRouteGroupIds([
        routeFeature("a", "Sverigeleden (23)", null),
        routeFeature("b", "Sverigeleden", "23"),
        routeFeature("c", "Unrelated", "99"),
      ]);
      expect(sameGroup(features, 0, 1)).toBe(true);
      expect(sameGroup(features, 0, 2)).toBe(false);
    });

    it("does not group network umbrella legs with different parenthetical names", () => {
      const features = assignRouteGroupIds([
        routeFeature(
          "a",
          "Regionalt cykelnät Stockholm (Kymlingestråket)",
          null,
          "rcn",
        ),
        routeFeature(
          "b",
          "Regionalt cykelnät Stockholm (Mälardalsleden)",
          null,
          "rcn",
        ),
      ]);
      expect(sameGroup(features, 0, 1)).toBe(false);
    });

    it("groups annotation variant with base name", () => {
      const features = assignRouteGroupIds([
        routeFeature("a", "Mälardalsleden", null, "rcn"),
        routeFeature("b", "Mälardalsleden (planerat)", null, "rcn"),
      ]);
      expect(sameGroup(features, 0, 1)).toBe(true);
    });

    it("does not group same ref on lcn with different distinct names", () => {
      const features = assignRouteGroupIds([
        routeFeature("a", "Sverigeleden (18)", "18", "ncn"),
        routeFeature("b", "Bicycle Route", "18", "lcn"),
        routeFeature("c", "Huddinge cykelturnät", "18", "lcn"),
      ]);
      expect(sameGroup(features, 0, 1)).toBe(false);
      expect(sameGroup(features, 0, 2)).toBe(false);
      expect(sameGroup(features, 1, 2)).toBe(false);
    });

    it("groups two relations with identical leg name (split OSM geometry)", () => {
      const features = assignRouteGroupIds([
        routeFeature("a", "Regionalt cykelnät X (Kymlingestråket)", null, "rcn"),
        routeFeature("b", "Regionalt cykelnät X (Kymlingestråket)", null, "rcn"),
      ]);
      expect(sameGroup(features, 0, 1)).toBe(true);
    });
  });
});
