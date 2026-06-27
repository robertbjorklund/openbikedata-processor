import { join } from "node:path";
import { configFromEnvironment } from "../Config";
import { GeoJSONOutputPaths } from "../io/GeoJSONFiles";
import { generateTiles } from "../transforms/TilesGenerator";

const config = configFromEnvironment();
const outputDir = config.outputDir;
const outputPaths = new GeoJSONOutputPaths(outputDir);

generateTiles(outputPaths, outputDir, {
  mbTilesPath: join(outputDir, "openbikemap.mbtiles"),
  tilesDir: join(outputDir, "openbikemap"),
}).catch((error) => {
  console.error("Failed regenerating tiles", error);
  process.exit(1);
});
