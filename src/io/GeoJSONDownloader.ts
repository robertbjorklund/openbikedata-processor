import { strict as assert } from "assert";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { BboxGridCell, trailsGridFromEnvironment } from "../utils/bboxGrid";
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
  KUMI = "https://overpass.kumi.systems/api/interpreter",
  FR = "https://overpass.openstreetmap.fr/api/interpreter",
}

/** Tried in order; spread load across public mirrors. */
const OVERPASS_ENDPOINTS = [
  OSMEndpoint.KUMI,
  OSMEndpoint.FR,
  OSMEndpoint.Z,
  OSMEndpoint.LZ4,
];

export default async function downloadAndConvertToGeoJSON(
  folder: string,
  bbox: GeoJSON.BBox | null,
): Promise<InputDataPaths> {
  const paths = new InputDataPaths(folder);

  console.log("Phase 1: Downloading OSM data...");
  const trailsGrid = await trailsGridFromEnvironment();
  if (trailsGrid) {
    assert(
      bbox !== null,
      "BBOX must be set when TRAILS_BBOX_GRID (or BBOX_GRID) is used — routes download the full region in one query",
    );
    console.log(
      `Trails: downloading ${trailsGrid.length} grid cells; routes: single query for region bbox ${JSON.stringify(bbox)}`,
    );
    await downloadLayerInGrid("trails", trailsDownloadConfig, trailsGrid, paths);
    await downloadOSMJSON(routesDownloadConfig, paths.osmJSON.routes, bbox);
    await convertOSMFileToGeoJSON(paths.osmJSON.routes, paths.geoJSON.routes);
  } else {
    await downloadOSMJSON(trailsDownloadConfig, paths.osmJSON.trails, bbox);
    await convertOSMFileToGeoJSON(paths.osmJSON.trails, paths.geoJSON.trails);
    await downloadOSMJSON(routesDownloadConfig, paths.osmJSON.routes, bbox);
    await convertOSMFileToGeoJSON(paths.osmJSON.routes, paths.geoJSON.routes);
  }

  return paths;
}

function overpassURLForQuery(endpoint: OSMEndpoint, query: string): string {
  return endpoint + "?data=" + encodeURIComponent(query);
}

async function downloadLayerInGrid(
  layer: "trails" | "routes",
  config: OSMDownloadConfig,
  grid: BboxGridCell[],
  paths: InputDataPaths,
): Promise<void> {
  const tempDir = await mkdtemp(join(tmpdir(), `openbikedata-${layer}-`));
  const features: GeoJSON.Feature[] = [];
  const geoPath = paths.geoJSON[layer];
  const osmPath = paths.osmJSON[layer];

  try {
    for (const [index, cell] of grid.entries()) {
      console.log(
        `Downloading ${layer} grid cell ${index + 1}/${grid.length} (${cell.name}): ${JSON.stringify(cell.bbox)}`,
      );
      const partOsm = join(tempDir, `${layer}-${index}.osmjson`);
      const partGeo = join(tempDir, `${layer}-${index}.geojson`);

      await downloadOSMJSON(config, partOsm, cell.bbox);
      await convertOSMFileToGeoJSON(partOsm, partGeo);

      const geojson = JSON.parse(
        await readFile(partGeo, "utf-8"),
      ) as GeoJSON.FeatureCollection;
      features.push(...geojson.features);
      console.log(`  -> ${geojson.features.length} features (${features.length} total)`);

      if (index < grid.length - 1) {
        const pauseMs = Number.parseInt(
          process.env.OVERPASS_GRID_PAUSE_MS ?? "90000",
          10,
        );
        console.log(`Waiting ${pauseMs / 1000}s before next grid cell...`);
        await sleep(pauseMs);
      }
    }

    await writeFile(
      geoPath,
      JSON.stringify({
        type: "FeatureCollection",
        features,
      } satisfies GeoJSON.FeatureCollection),
    );
    await writeFile(
      osmPath,
      JSON.stringify({ type: "grid", layer, cells: grid.map((cell) => cell.name) }),
    );
    console.log(`Merged ${features.length} ${layer} features from ${grid.length} grid cells.`);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function downloadOSMJSON(
  config: OSMDownloadConfig,
  targetPath: string,
  bbox: GeoJSON.BBox | null,
) {
  const query = config.query(bbox);
  console.log("Performing overpass query...");
  console.log(query);
  await downloadToFile(query, targetPath);
}

async function downloadToFile(
  query: string,
  targetPath: string,
  retries = 10,
  attempt = 0,
): Promise<void> {
  const endpoints = overpassEndpointsFromEnvironment();
  const endpoint = endpoints[attempt % endpoints.length];
  const sourceURL = overpassURLForQuery(endpoint, query);

  try {
    console.log(`Downloading from ${endpoint}...`);
    await _downloadToFile(sourceURL, targetPath);
  } catch (e) {
    if (retries <= 0) {
      throw e;
    }
    const nextEndpoint = endpoints[(attempt + 1) % endpoints.length];
    console.log(
      `Download failed: ${e}. Retrying in 60 seconds (${nextEndpoint})...`,
    );
    await sleep(60000);
    await downloadToFile(query, targetPath, retries - 1, attempt + 1);
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
  await assertDownloadLooksValid(targetPath);
}

async function assertDownloadLooksValid(targetPath: string): Promise<void> {
  const size = (await stat(targetPath)).size;
  if (size < 1000) {
    throw new Error(`Download too small (${size} bytes), likely empty or failed`);
  }

  const contents = await readFile(targetPath, "utf-8");
  const json: { elements?: unknown[]; remark?: string } = JSON.parse(contents);
  if (json.remark && !json.elements?.length) {
    throw new Error(`Overpass error: ${json.remark}`);
  }
  if (!Array.isArray(json.elements) || json.elements.length === 0) {
    throw new Error("Overpass returned no elements");
  }
}

function overpassEndpointsFromEnvironment(): OSMEndpoint[] {
  if (process.env.OVERPASS_ENDPOINT !== undefined) {
    return [process.env.OVERPASS_ENDPOINT as OSMEndpoint];
  }

  if (process.env.OVERPASS_ENDPOINTS !== undefined) {
    return process.env.OVERPASS_ENDPOINTS.split(",")
      .map((endpoint) => endpoint.trim())
      .filter(Boolean) as OSMEndpoint[];
  }

  return OVERPASS_ENDPOINTS;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
