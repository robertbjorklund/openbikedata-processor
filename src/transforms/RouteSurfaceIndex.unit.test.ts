import { buildRouteSurfaceIndex } from "./RouteSurfaceIndex";
import { writeFeatureCollection } from "../io/GeoJSONRewrite";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

describe("buildRouteSurfaceIndex", () => {
  it("computes paved share from member way surfaces", async () => {
    const dir = await mkdtemp(join(tmpdir(), "route-surface-"));
    const path = join(dir, "routes.geojson");

    try {
      await writeFeatureCollection(path, [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [18.0, 59.33],
              [18.01, 59.33],
            ],
          },
          properties: {
            type: "way",
            id: 1,
            tags: { highway: "cycleway", surface: "asphalt" },
            relations: [{ rel: 42, reltags: { route: "bicycle" } }],
          },
        },
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [18.01, 59.33],
              [18.02, 59.33],
            ],
          },
          properties: {
            type: "way",
            id: 2,
            tags: { highway: "path", surface: "gravel" },
            relations: [{ rel: 42, reltags: { route: "bicycle" } }],
          },
        },
      ]);

      const index = await buildRouteSurfaceIndex(path);
      const pavedRatio = index.get(42);

      expect(pavedRatio).toBeGreaterThan(0.4);
      expect(pavedRatio).toBeLessThan(0.6);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("includes mtb route relations in paved share", async () => {
    const dir = await mkdtemp(join(tmpdir(), "route-surface-"));
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
            id: 1,
            tags: { highway: "path", surface: "gravel" },
            relations: [{ rel: 9856915, reltags: { route: "mtb" } }],
          },
        },
      ]);

      const index = await buildRouteSurfaceIndex(path);
      expect(index.get(9856915)).toBe(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
