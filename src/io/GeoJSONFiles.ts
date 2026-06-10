import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { FeatureType } from "../format";

export interface CommonGeoJSONPaths {
  readonly trails: string;
  readonly routes: string;
}

export class InputDataPaths {
  readonly osmJSON: OSMJSONInputPaths;
  readonly geoJSON: GeoJSONInputPaths;

  constructor(folder: string) {
    this.osmJSON = new OSMJSONInputPaths(folder);
    this.geoJSON = new GeoJSONInputPaths(folder);
  }
}

export class OSMJSONInputPaths {
  readonly trails: string;
  readonly routes: string;

  constructor(folder: string) {
    ensureDir(folder);
    this.trails = join(folder, "input_trails.osmjson");
    this.routes = join(folder, "input_routes.osmjson");
  }
}

export class GeoJSONInputPaths {
  readonly trails: string;
  readonly routes: string;

  constructor(folder: string) {
    ensureDir(folder);
    this.trails = join(folder, "input_trails.geojson");
    this.routes = join(folder, "input_routes.geojson");
  }
}

export class GeoJSONOutputPaths implements CommonGeoJSONPaths {
  readonly trails: string;
  readonly routes: string;
  readonly mapboxGL: CommonGeoJSONPaths;

  constructor(folder: string) {
    ensureDir(folder);
    this.trails = join(folder, "trails.geojson");
    this.routes = join(folder, "routes.geojson");
    this.mapboxGL = {
      trails: join(folder, "mapboxgl_trails.geojson"),
      routes: join(folder, "mapboxgl_routes.geojson"),
    };
  }
}

export interface DataPaths {
  input: InputDataPaths;
  output: GeoJSONOutputPaths;
}

export function getPath(
  paths: CommonGeoJSONPaths,
  featureType: FeatureType,
): string {
  switch (featureType) {
    case FeatureType.Trail:
      return paths.trails;
    case FeatureType.Route:
      return paths.routes;
  }
}

function ensureDir(folder: string) {
  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true });
  }
}
