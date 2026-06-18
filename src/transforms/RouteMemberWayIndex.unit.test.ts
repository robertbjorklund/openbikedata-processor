import { buildRouteMemberWayIds, wayIsRouteMember } from "./RouteMemberWayIndex";
import { writeFeatureCollection } from "../io/GeoJSONRewrite";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

describe("buildRouteMemberWayIds", () => {
  it("collects way ids that are members of bicycle or mtb routes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "route-member-ways-"));
    const path = join(dir, "routes.geojson");

    try {
      await writeFeatureCollection(path, [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [13.05, 55.626],
              [13.051, 55.626],
            ],
          },
          properties: {
            type: "way",
            id: 100,
            tags: { highway: "path", surface: "gravel" },
            relations: [{ rel: 9856915, reltags: { route: "mtb" } }],
          },
        },
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [13.06, 55.626],
              [13.061, 55.626],
            ],
          },
          properties: {
            type: "way",
            id: 200,
            tags: { highway: "path", "mtb:scale": "1" },
            relations: [],
          },
        },
      ]);

      const wayIds = await buildRouteMemberWayIds(path);
      expect(wayIds.has(100)).toBe(true);
      expect(wayIds.has(200)).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("wayIsRouteMember", () => {
  it("detects route membership from relations on the way", () => {
    expect(
      wayIsRouteMember({
        type: "way",
        id: 1,
        relations: [{ rel: 42, reltags: { route: "bicycle" } }],
      }),
    ).toBe(true);
  });

  it("detects route membership from a prebuilt index", () => {
    expect(
      wayIsRouteMember({ type: "way", id: 99, relations: [] }, new Set([99])),
    ).toBe(true);
  });
});
