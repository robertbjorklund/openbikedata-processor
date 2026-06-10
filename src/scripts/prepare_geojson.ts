import { configFromEnvironment } from "../Config";
import { GeoJSONOutputPaths, InputDataPaths } from "../io/GeoJSONFiles";
import prepare from "../PrepareGeoJSON";

const config = configFromEnvironment();

prepare(
  {
    input: new InputDataPaths(config.workingDir),
    output: new GeoJSONOutputPaths(config.outputDir),
  },
  config,
).catch((reason) => {
  console.error("Failed preparing", reason);
  process.exit(1);
});
