import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Config } from "./Config";
import { TrailFeature } from "./format";
import { InputRouteFeature } from "./features/RouteFeature";
import { InputTrailFeature } from "./features/TrailFeature";
import { DataPaths } from "./io/GeoJSONFiles";
import {
  readAllFeatures,
  writeFeatureCollection,
} from "./io/GeoJSONRewrite";
import { readGeoJSONFeatures } from "./io/GeoJSONReader";
import { mergeTrailsByGroup } from "./transforms/FeatureMerger";
import toFeatureCollection from "./transforms/FeatureCollection";
import { formatForMapboxGL } from "./transforms/MapboxGLFormatter";
import { formatRoute } from "./transforms/RouteFormatter";
import { buildRouteSurfaceIndex } from "./transforms/RouteSurfaceIndex";
import { formatTrail } from "./transforms/TrailFormatter";
import { generateTiles } from "./transforms/TilesGenerator";
import { flatMapArray } from "./transforms/StreamTransforms";

export default async function prepare(paths: DataPaths, config: Config) {
  console.log("Phase 2: Formatting trails...");
  await writeFormattedFeatures(
    paths.input.geoJSON.trails,
    paths.output.trails,
    (feature) => formatTrail(feature as InputTrailFeature),
  );
  await mergeTrailGroupsInFile(paths.output.trails);
  await writeMapboxGLFeatures(paths.output.trails, paths.output.mapboxGL.trails);

  console.log("Phase 2: Formatting routes...");
  const routeSurfaceIndex = await buildRouteSurfaceIndex(
    paths.input.geoJSON.routes,
  );
  await writeFormattedFeatures(
    paths.input.geoJSON.routes,
    paths.output.routes,
    (feature) => formatRoute(feature as InputRouteFeature, routeSurfaceIndex),
  );
  await writeMapboxGLFeatures(
    paths.output.routes,
    paths.output.mapboxGL.routes,
  );

  if (config.tiles) {
    await generateTiles(paths.output, config.workingDir, config.tiles);
  }

  console.log("Done. Output written to", config.outputDir);
}

async function writeFormattedFeatures(
  inputPath: string,
  outputPath: string,
  formatter: (feature: GeoJSON.Feature) => GeoJSON.Feature[],
) {
  await pipeline(
    readGeoJSONFeatures(inputPath),
    flatMapArray(formatter),
    toFeatureCollection(),
    createWriteStream(outputPath),
  );
  console.log(`Wrote ${outputPath}`);
}

async function mergeTrailGroupsInFile(path: string) {
  const trails = (await readAllFeatures(path)) as TrailFeature[];
  const merged = mergeTrailsByGroup(trails);
  await writeFeatureCollection(path, merged);
  console.log(
    `Merged trails by name/category: ${trails.length} → ${merged.length} features`,
  );
}

async function writeMapboxGLFeatures(inputPath: string, outputPath: string) {
  await pipeline(
    readGeoJSONFeatures(inputPath),
    flatMapArray((feature) => [formatForMapboxGL(feature as any)]),
    toFeatureCollection(),
    createWriteStream(outputPath),
  );
  console.log(`Wrote ${outputPath}`);
}
