import {
  FeatureType,
  RouteFeature,
  SourceType,
  Status,
} from "../format";
import { assignRouteGroupIds } from "./AssignFeatureGroupIds";

function route(
  id: string,
  name: string | null,
  ref: string | null,
  network = "ncn",
): RouteFeature {
  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: [
        [0, 0],
        [1, 1],
      ],
    },
    properties: {
      type: FeatureType.Route,
      id,
      groupId: null,
      stageId: null,
      name,
      ref,
      from: null,
      to: null,
      via: null,
      network,
      distance: null,
      roundtrip: null,
      pavedRatio: null,
      elevationProfile: null,
      status: Status.Operating,
      sources: [{ type: SourceType.OPENSTREETMAP, id: `relation/${id}` }],
    },
  };
}

describe("assignRouteGroupIds", () => {
  it("links routes that share normalized name or ref", () => {
    const features = assignRouteGroupIds([
      route("a", "Sverigeleden (23)", null),
      route("b", "Sverigeleden", "23"),
      route("c", "Unrelated", "99"),
    ]);

    const groupA = features[0].properties.groupId;
    const groupB = features[1].properties.groupId;
    expect(groupA).toBeTruthy();
    expect(groupA).toBe(groupB);
    expect(features[2].properties.groupId).not.toBe(groupA);
  });

  it("does not link routes that only share ref across different networks", () => {
    const features = assignRouteGroupIds([
      route("a", "Sverigeleden (18)", "18", "ncn"),
      route("b", "Bicycle Route", "18", "lcn"),
      route("c", "Huddinge cykelturnät", "18", "lcn"),
    ]);

    const sverigeleden = features[0].properties.groupId;
    expect(sverigeleden).toBeTruthy();
    expect(features[1].properties.groupId).not.toBe(sverigeleden);
    expect(features[2].properties.groupId).not.toBe(sverigeleden);
  });
});
