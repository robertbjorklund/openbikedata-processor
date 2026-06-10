import { writeFile } from "fs/promises";
import { Writable } from "stream";
import { pipeline } from "stream/promises";
import { readGeoJSONFeatures } from "./GeoJSONReader";

export async function readAllFeatures(path: string): Promise<GeoJSON.Feature[]> {
  const features: GeoJSON.Feature[] = [];

  await pipeline(
    readGeoJSONFeatures(path),
    new Writable({
      objectMode: true,
      write(feature, _encoding, callback) {
        features.push(feature);
        callback();
      },
    }),
  );

  return features;
}

export async function writeFeatureCollection(
  path: string,
  features: GeoJSON.Feature[],
): Promise<void> {
  await writeFile(
    path,
    JSON.stringify({ type: "FeatureCollection", features }),
    "utf8",
  );
}
