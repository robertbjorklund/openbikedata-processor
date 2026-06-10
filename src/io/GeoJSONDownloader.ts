import { writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import {
  OSMDownloadConfig,
  routesDownloadConfig,
  trailsDownloadConfig,
} from "./DownloadURLs";
import { InputDataPaths } from "./GeoJSONFiles";
import convertOSMFileToGeoJSON from "./OSMToGeoJSONConverter";

enum OSMEndpoint {
  LZ4 = "https://lz4.overpass-api.de/api/interpreter",
  Z = "https://z.overpass-api.de/api/interpreter",
}

export default async function downloadAndConvertToGeoJSON(
  folder: string,
  bbox: GeoJSON.BBox | null,
): Promise<InputDataPaths> {
  const paths = new InputDataPaths(folder);

  console.log("Phase 1: Downloading OSM data...");
  await downloadOSMJSON(
    OSMEndpoint.Z,
    trailsDownloadConfig,
    paths.osmJSON.trails,
    bbox,
  );
  await downloadOSMJSON(
    OSMEndpoint.LZ4,
    routesDownloadConfig,
    paths.osmJSON.routes,
    bbox,
  );

  console.log("Phase 1: Converting OSM JSON to GeoJSON...");
  await convertOSMFileToGeoJSON(paths.osmJSON.trails, paths.geoJSON.trails);
  await convertOSMFileToGeoJSON(paths.osmJSON.routes, paths.geoJSON.routes);

  return paths;
}

async function downloadOSMJSON(
  endpoint: OSMEndpoint,
  config: OSMDownloadConfig,
  targetPath: string,
  bbox: GeoJSON.BBox | null,
) {
  const query = config.query(bbox);
  console.log("Performing overpass query...");
  console.log(query);
  const url = endpoint + "?data=" + encodeURIComponent(query);
  await downloadToFile(url, targetPath);
}

async function downloadToFile(
  sourceURL: string,
  targetPath: string,
  retries = 10,
): Promise<void> {
  try {
    await _downloadToFile(sourceURL, targetPath);
  } catch (e) {
    if (retries <= 0) {
      throw e;
    }
    console.log(`Download failed: ${e}. Retrying in 60 seconds...`);
    await sleep(60000);
    await downloadToFile(sourceURL, targetPath, retries - 1);
  }
}

async function _downloadToFile(
  sourceURL: string,
  targetPath: string,
): Promise<void> {
  const response = await fetch(sourceURL, {
    headers: {
      Referer: "https://openbikemap.org",
      "User-Agent":
        "openbikedata-processor (+https://openbikemap.org)",
    },
    signal: AbortSignal.timeout(30 * 60 * 1000),
  });

  if (!response.ok) {
    throw new Error(
      `Failed downloading file (status ${response.status}): ${sourceURL}`,
    );
  }

  const stream = Readable.fromWeb(response.body as any);
  await writeFile(targetPath, stream);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
