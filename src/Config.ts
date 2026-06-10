import { strict as assert } from "assert";

export type TilesConfig = { mbTilesPath: string; tilesDir: string };

export interface Config {
  bbox: GeoJSON.BBox | null;
  workingDir: string;
  outputDir: string;
  tiles: TilesConfig | null;
}

export function configFromEnvironment(): Config {
  let bbox: GeoJSON.BBox | null = null;
  if (process.env.BBOX) {
    const parsed = JSON.parse(process.env.BBOX);
    assert(
      Array.isArray(parsed) &&
        parsed.length === 4 &&
        parsed.every((value) => typeof value === "number"),
    );
    bbox = parsed as GeoJSON.BBox;
  }

  const workingDir = process.env.WORKING_DIR ?? "data";
  const outputDir = process.env.OUTPUT_DIR ?? workingDir;

  return {
    bbox,
    workingDir,
    outputDir,
    tiles:
      process.env.GENERATE_TILES === "1"
        ? {
            mbTilesPath: `${outputDir}/openbikemap.mbtiles`,
            tilesDir: `${outputDir}/openbikemap`,
          }
        : null,
  };
}
