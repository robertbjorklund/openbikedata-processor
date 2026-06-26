import { createWriteStream } from "fs";

import { pipeline } from "stream/promises";

import { Config } from "./Config";

import { RouteFeature, TrailFeature } from "./format";

import { InputRouteFeature } from "./features/RouteFeature";

import { InputTrailFeature } from "./features/TrailFeature";

import { DataPaths } from "./io/GeoJSONFiles";

import {

  readAllFeatures,

  writeFeatureCollection,

} from "./io/GeoJSONRewrite";

import { readGeoJSONFeatures } from "./io/GeoJSONReader";

import {
  assignRouteGroupIds,
  assignTrailGroupIds,
} from "./transforms/AssignFeatureGroupIds";
import coalesceRouteStages from "./transforms/normalization/CoalesceRouteStages";
import combineRouteSegments from "./transforms/normalization/CombineRouteSegments";
import combineTrailSegments from "./transforms/normalization/CombineTrailSegments";
import {
  mergeRoutesByGroup,
  mergeTrailsByGroup,
} from "./transforms/FeatureMerger";

import toFeatureCollection from "./transforms/FeatureCollection";

import { formatForMapboxGL } from "./transforms/MapboxGLFormatter";

import { formatRoute } from "./transforms/RouteFormatter";

import { buildRouteMemberWayIds } from "./transforms/RouteMemberWayIndex";
import { buildRouteSurfaceIndex } from "./transforms/RouteSurfaceIndex";

import { formatTrail } from "./transforms/TrailFormatter";

import { generateTiles } from "./transforms/TilesGenerator";

import { flatMapArray } from "./transforms/StreamTransforms";

import { createElevationProcessor } from "./transforms/Elevation";



export default async function prepare(paths: DataPaths, config: Config) {

  const elevationTransform = await createElevationTransform(

    config.elevationServer,

  );



  try {

    console.log("Phase 2: Building route member way index...");
    const routeMemberWayIds = await buildRouteMemberWayIds(
      paths.input.geoJSON.routes,
    );
    console.log(
      `Indexed ${routeMemberWayIds.size} OSM ways in bicycle/MTB route relations`,
    );

    console.log("Phase 2: Formatting trails...");

    await writeFormattedFeatures(
      paths.input.geoJSON.trails,
      paths.output.trails,
      (feature) =>
        formatTrail(feature as InputTrailFeature, routeMemberWayIds),
    );

    await mergeTrailGroupsInFile(paths.output.trails);

    await combineTrailSegmentsInFile(paths.output.trails);

    await assignTrailGroupIdsInFile(paths.output.trails);

    await enhanceFeaturesInFile(

      paths.output.trails,

      elevationTransform?.transform ?? null,

    );

    await writeMapboxGLFeatures(

      paths.output.trails,

      paths.output.mapboxGL.trails,

    );



    console.log("Phase 2: Formatting routes...");

    const routeSurfaceIndex = await buildRouteSurfaceIndex(

      paths.input.geoJSON.routes,

    );

    await writeFormattedFeatures(

      paths.input.geoJSON.routes,

      paths.output.routes,

      (feature) =>

        formatRoute(feature as InputRouteFeature, routeSurfaceIndex),

    );

    await combineRouteSegmentsInFile(paths.output.routes);

    await coalesceRouteStagesInFile(paths.output.routes);

    await assignRouteGroupIdsInFile(paths.output.routes);

    await enhanceFeaturesInFile(

      paths.output.routes,

      elevationTransform?.transform ?? null,

    );

    await writeMapboxGLFeatures(

      paths.output.routes,

      paths.output.mapboxGL.routes,

    );



    if (config.tiles) {

      await generateTiles(paths.output, config.workingDir, config.tiles);

    }



    console.log("Done. Output written to", config.outputDir);

  } finally {

    if (elevationTransform) {

      await elevationTransform.processor.close();

    }

  }

}



async function createElevationTransform(

  elevationServerConfig: Config["elevationServer"],

) {

  if (!elevationServerConfig) {

    return null;

  }



  console.log("Elevation enrichment enabled");

  const processor = await createElevationProcessor(elevationServerConfig);

  return {

    processor,

    transform: async (feature: GeoJSON.Feature) => {

      await processor.enhanceFeature(feature);

      return feature;

    },

  };

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



async function combineTrailSegmentsInFile(path: string) {

  const trails = (await readAllFeatures(path)) as TrailFeature[];

  const combined = combineTrailSegments(trails);

  await writeFeatureCollection(path, combined);

  console.log(

    `Combined connected trail segments: ${trails.length} → ${combined.length} features`,

  );

}



async function assignTrailGroupIdsInFile(path: string) {

  const trails = (await readAllFeatures(path)) as TrailFeature[];

  const withGroupIds = assignTrailGroupIds(trails);

  await writeFeatureCollection(path, withGroupIds);

  console.log(`Assigned trail groupId to ${withGroupIds.length} features`);

}



async function mergeRouteGroupsInFile(path: string) {

  const routes = (await readAllFeatures(path)) as RouteFeature[];

  const merged = mergeRoutesByGroup(routes);

  await writeFeatureCollection(path, merged);

  console.log(

    `Merged routes by name/ref: ${routes.length} → ${merged.length} features`,

  );

}



async function combineRouteSegmentsInFile(path: string) {

  const routes = (await readAllFeatures(path)) as RouteFeature[];

  const combined = combineRouteSegments(routes);

  await writeFeatureCollection(path, combined);

  console.log(

    `Combined connected route segments: ${routes.length} → ${combined.length} features`,

  );

}



async function coalesceRouteStagesInFile(path: string) {

  const routes = (await readAllFeatures(path)) as RouteFeature[];

  const coalesced = coalesceRouteStages(routes);

  await writeFeatureCollection(path, coalesced);

  console.log(

    `Coalesced route stages: ${routes.length} → ${coalesced.length} features`,

  );

}



async function assignRouteGroupIdsInFile(path: string) {

  const routes = (await readAllFeatures(path)) as RouteFeature[];

  const withGroupIds = assignRouteGroupIds(routes);

  await writeFeatureCollection(path, withGroupIds);

  console.log(`Assigned route groupId to ${withGroupIds.length} features`);

}



async function enhanceFeaturesInFile(

  path: string,

  transform: ((feature: GeoJSON.Feature) => Promise<GeoJSON.Feature>) | null,

  parallelism = 10,

) {

  if (!transform) {

    return;

  }

  const enhance = transform;

  const features = await readAllFeatures(path);

  if (features.length === 0) {

    return;

  }



  const enhanced: GeoJSON.Feature[] = new Array(features.length);

  let nextIndex = 0;



  async function worker() {

    while (true) {

      const index = nextIndex++;

      if (index >= features.length) {

        break;

      }

      enhanced[index] = await enhance(features[index]);

    }

  }



  await Promise.all(

    Array.from({ length: Math.min(parallelism, features.length) }, () =>

      worker(),

    ),

  );



  await writeFeatureCollection(path, enhanced);

  console.log(`Added elevation data to ${enhanced.length} features in ${path}`);

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


