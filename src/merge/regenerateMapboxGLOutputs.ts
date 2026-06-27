import { RouteFeature, TrailFeature } from "../format";
import { GeoJSONOutputPaths } from "../io/GeoJSONFiles";
import { readAllFeatures, writeFeatureCollection } from "../io/GeoJSONRewrite";
import { formatForMapboxGL } from "../transforms/MapboxGLFormatter";

export async function regenerateMapboxGLOutputs(
  outputPaths: GeoJSONOutputPaths,
): Promise<void> {
  const trails = (await readAllFeatures(outputPaths.trails)) as TrailFeature[];
  const routes = (await readAllFeatures(outputPaths.routes)) as RouteFeature[];

  await writeFeatureCollection(
    outputPaths.mapboxGL.trails,
    trails.map((feature) => formatForMapboxGL(feature)),
  );
  await writeFeatureCollection(
    outputPaths.mapboxGL.routes,
    routes.map((feature) => formatForMapboxGL(feature)),
  );

  console.log(
    `Regenerated mapboxgl GeoJSON (${trails.length} trails, ${routes.length} routes)`,
  );
}
