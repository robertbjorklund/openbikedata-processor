import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { trailsGridFromEnvironment } from "./bboxGrid";

describe("trailsGridFromEnvironment", () => {
  const originalTrailsGrid = process.env.TRAILS_BBOX_GRID;
  const originalBboxGrid = process.env.BBOX_GRID;

  afterEach(() => {
    if (originalTrailsGrid === undefined) {
      delete process.env.TRAILS_BBOX_GRID;
    } else {
      process.env.TRAILS_BBOX_GRID = originalTrailsGrid;
    }
    if (originalBboxGrid === undefined) {
      delete process.env.BBOX_GRID;
    } else {
      process.env.BBOX_GRID = originalBboxGrid;
    }
  });

  it("returns null when no grid env is set", async () => {
    delete process.env.TRAILS_BBOX_GRID;
    delete process.env.BBOX_GRID;
    await expect(trailsGridFromEnvironment()).resolves.toBeNull();
  });

  it("prefers TRAILS_BBOX_GRID over BBOX_GRID", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "openbikedata-grid-"));
    const preferred = join(tempDir, "preferred.json");
    const fallback = join(tempDir, "fallback.json");

    await writeFile(
      preferred,
      JSON.stringify([{ name: "preferred", bbox: [1, 2, 3, 4] }]),
    );
    await writeFile(
      fallback,
      JSON.stringify([{ name: "fallback", bbox: [5, 6, 7, 8] }]),
    );

    process.env.TRAILS_BBOX_GRID = preferred;
    process.env.BBOX_GRID = fallback;

    await expect(trailsGridFromEnvironment()).resolves.toEqual([
      { name: "preferred", bbox: [1, 2, 3, 4] },
    ]);

    await rm(tempDir, { recursive: true, force: true });
  });
});
