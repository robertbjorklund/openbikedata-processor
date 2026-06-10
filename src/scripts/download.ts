import { configFromEnvironment } from "../Config";
import downloadAndConvertToGeoJSON from "../io/GeoJSONDownloader";

const config = configFromEnvironment();

downloadAndConvertToGeoJSON(config.workingDir, config.bbox).catch((reason) => {
  console.error("Failed downloading", reason);
  process.exit(1);
});
