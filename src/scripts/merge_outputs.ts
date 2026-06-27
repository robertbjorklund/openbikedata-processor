import { copyFile, mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { GeoJSONOutputPaths } from "../io/GeoJSONFiles";
import { readAllFeatures, writeFeatureCollection } from "../io/GeoJSONRewrite";
import {
  MERGE_GEOJSON_FILES,
  mergeFeatureCollections,
  parseReplaceBbox,
} from "../merge/mergeFeatureCollections";
import { regenerateMapboxGLOutputs } from "../merge/regenerateMapboxGLOutputs";
import { generateTiles } from "../transforms/TilesGenerator";
import { runCommand } from "../utils/ProcessRunner";

function printUsage(): void {
  console.log(
    "Usage: merge_outputs <outputDir> <baseDir> <patchDir> [patchDir2...] [options]",
  );
  console.log("");
  console.log("Options:");
  console.log(
    "  --replace-bbox '[west,south,east,north]'  Drop base features in bbox before applying patches",
  );
  console.log(
    "  --tiles                                     Regenerate openbikemap.mbtiles from merged mapboxgl GeoJSON",
  );
}

async function ensureDirectory(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function mergeGeoJsonFile(
  relativePath: string,
  baseDir: string,
  patchDirs: string[],
  outputDir: string,
  replaceBbox: GeoJSON.BBox | null,
): Promise<number> {
  const basePath = join(baseDir, relativePath);
  if (!(await fileExists(basePath))) {
    throw new Error(`Base file not found: ${basePath}`);
  }

  let merged = await readAllFeatures(basePath);
  const baseCount = merged.length;

  for (const patchDir of patchDirs) {
    const patchPath = join(patchDir, relativePath);
    if (!(await fileExists(patchPath))) {
      console.warn(`Skipping missing patch file: ${patchPath}`);
      continue;
    }

    const patch = await readAllFeatures(patchPath);
    const before = merged.length;
    merged = mergeFeatureCollections(merged, patch, replaceBbox);
    console.log(
      `  ${relativePath}: ${before} + ${patch.length} patch -> ${merged.length} (${patchDir})`,
    );
  }

  const outputPath = join(outputDir, relativePath);
  await ensureDirectory(outputDir);
  await writeFeatureCollection(outputPath, merged);
  console.log(
    `Wrote ${outputPath} (${baseCount} base -> ${merged.length} merged)`,
  );

  return merged.length;
}

async function mergeMbtiles(
  baseDir: string,
  patchDirs: string[],
  outputDir: string,
): Promise<void> {
  const fileName = "openbikemap.mbtiles";
  const basePath = join(baseDir, fileName);
  if (!(await fileExists(basePath))) {
    console.warn(`No base MBTiles at ${basePath}; skipping MBTiles merge`);
    return;
  }

  const outputPath = join(outputDir, fileName);
  await copyFile(basePath, outputPath);

  for (const patchDir of patchDirs) {
    const patchPath = join(patchDir, fileName);
    if (!(await fileExists(patchPath))) {
      continue;
    }

    const tempPath = `${outputPath}.tmp`;
    await runCommand("tile-join", [
      "-f",
      "--no-tile-size-limit",
      "-o",
      tempPath,
      outputPath,
      patchPath,
    ]);
    await copyFile(tempPath, outputPath);
    console.log(`Merged MBTiles patch from ${patchDir}`);
  }
}

function parseArgs(argv: string[]): {
  outputDir: string;
  baseDir: string;
  patchDirs: string[];
  replaceBbox: GeoJSON.BBox | null;
  regenerateTiles: boolean;
  skipTiles: boolean;
} {
  const positional: string[] = [];
  let replaceBbox: GeoJSON.BBox | null = null;
  let regenerateTiles = false;
  let skipTiles = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--replace-bbox") {
      const value = argv[++i];
      if (!value) {
        throw new Error("--replace-bbox requires a JSON bbox value");
      }
      replaceBbox = parseReplaceBbox(value);
      continue;
    }
    if (arg === "--tiles") {
      regenerateTiles = true;
      continue;
    }
    if (arg === "--skip-tiles") {
      skipTiles = true;
      continue;
    }
    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    positional.push(arg);
  }

  if (positional.length < 3) {
    printUsage();
    process.exit(1);
  }

  const [outputDir, baseDir, ...patchDirs] = positional;
  if (patchDirs.length === 0) {
    printUsage();
    process.exit(1);
  }

  return { outputDir, baseDir, patchDirs, replaceBbox, regenerateTiles, skipTiles };
}

async function main(): Promise<void> {
  const {
    outputDir,
    baseDir,
    patchDirs,
    replaceBbox,
    regenerateTiles,
    skipTiles,
  } = parseArgs(process.argv.slice(2));

  console.log(`Merging into ${outputDir}`);
  console.log(`  base: ${baseDir}`);
  console.log(`  patches: ${patchDirs.join(", ")}`);
  if (replaceBbox) {
    console.log(`  replace bbox: ${JSON.stringify(replaceBbox)}`);
  }

  for (const relativePath of MERGE_GEOJSON_FILES) {
    console.log(`\n=== ${relativePath} ===`);
    await mergeGeoJsonFile(
      relativePath,
      baseDir,
      patchDirs,
      outputDir,
      replaceBbox,
    );
  }

  console.log("\n=== Regenerating mapboxgl GeoJSON ===");
  const outputPaths = new GeoJSONOutputPaths(outputDir);
  await regenerateMapboxGLOutputs(outputPaths);

  if (regenerateTiles && !skipTiles) {
    console.log("\n=== Regenerating openbikemap.mbtiles ===");
    await generateTiles(outputPaths, outputDir, {
      mbTilesPath: join(outputDir, "openbikemap.mbtiles"),
      tilesDir: join(outputDir, "openbikemap"),
    });
  } else if (!skipTiles) {
    console.log("\n=== Merging openbikemap.mbtiles (if present) ===");
    await mergeMbtiles(baseDir, patchDirs, outputDir);
  }

  console.log("\nMerge complete.");
}

main().catch((error) => {
  console.error("Merge failed:", error);
  process.exit(1);
});
