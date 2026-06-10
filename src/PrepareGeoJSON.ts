import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Config } from "./Config";
import { InputRouteFeature } from "./features/RouteFeature";
import { InputTrailFeature } from "./features/TrailFeature";
import { DataPaths } from "./io/GeoJSONFiles";
import { readGeoJSONFeatures } from "./io/GeoJSONReader";
import toFeatureCollection from "./transforms/FeatureCollection";
import { formatForMapboxGL } from "./transforms/MapboxGLFormatter";
import { formatRoute } from "./transforms/RouteFormatter";
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
  await writeMapboxGLFeatures(paths.output.trails, paths.output.mapboxGL.trails);

  console.log("Phase 2: Formatting routes...");
  await writeFormattedFeatures(
    paths.input.geoJSON.routes,
    paths.output.routes,
    (feature) => formatRoute(feature as InputRouteFeature),
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

async function writeMapboxGLFeatures(inputPath: string, outputPath: string) {
  await pipeline(
    readGeoJSONFeatures(inputPath),
    flatMapArray((feature) => [formatForMapboxGL(feature as any)]),
    toFeatureCollection(),
    createWriteStream(outputPath),
  );
  console.log(`Wrote ${outputPath}`);
}
