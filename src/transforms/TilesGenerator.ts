import * as path from "path";
import { TilesConfig } from "../Config";
import { GeoJSONOutputPaths } from "../io/GeoJSONFiles";
import { runCommand } from "../utils/ProcessRunner";

export async function generateTiles(
  geoJSONPaths: GeoJSONOutputPaths,
  workingDir: string,
  tilesConfig: TilesConfig,
): Promise<void> {
  console.log("Phase 3: Generating vector tiles...");

  const trailsMbtiles = path.join(workingDir, "trails.mbtiles");
  const routesMbtiles = path.join(workingDir, "routes.mbtiles");

  await runCommand("tippecanoe", [
    "-Q",
    "-o",
    trailsMbtiles,
    "-f",
    "-z",
    "15",
    "-Z",
    "9",
    "--simplify-only-low-zooms",
    "--drop-densest-as-needed",
    "--named-layer=trails:" + geoJSONPaths.mapboxGL.trails,
  ]);

  await runCommand("tippecanoe", [
    "-Q",
    "-o",
    routesMbtiles,
    "-f",
    "-z",
    "15",
    "-Z",
    "5",
    "--simplify-only-low-zooms",
    "--drop-densest-as-needed",
    "--named-layer=routes:" + geoJSONPaths.mapboxGL.routes,
  ]);

  await runCommand("tile-join", [
    "-f",
    "--no-tile-size-limit",
    "-o",
    tilesConfig.mbTilesPath,
    routesMbtiles,
    trailsMbtiles,
  ]);

  console.log(`Wrote ${tilesConfig.mbTilesPath}`);
}
