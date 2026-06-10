export enum FeatureType {
  Trail = "trail",
  Route = "route",
}

export enum Status {
  Operating = "operating",
  Disused = "disused",
  Abandoned = "abandoned",
  Proposed = "proposed",
  Planned = "planned",
  Construction = "construction",
}

export enum TrailCategory {
  Cycleway = "cycleway",
  BicycleRoute = "bicycle_route",
  MtbTrail = "mtb_trail",
  GravelTrack = "gravel_track",
  SharedPath = "shared_path",
}

export enum SourceType {
  OPENSTREETMAP = "openstreetmap",
}

export interface Source {
  type: SourceType;
  id: string;
}

export interface TrailProperties {
  type: FeatureType.Trail;
  id: string;
  category: TrailCategory;
  name: string | null;
  ref: string | null;
  surface: string | null;
  smoothness: string | null;
  tracktype: string | null;
  mtbScale: number | null;
  sacScale: string | null;
  bicycle: string | null;
  lit: boolean | null;
  oneway: boolean | null;
  network: string | null;
  lengthMeters: number | null;
  status: Status;
  sources: Source[];
}

export interface RouteProperties {
  type: FeatureType.Route;
  id: string;
  name: string | null;
  ref: string | null;
  network: string | null;
  distance: string | null;
  roundtrip: boolean | null;
  /** Share of relation length on paved surfaces (0–1), from member ways */
  pavedRatio: number | null;
  status: Status;
  sources: Source[];
}

export type TrailFeature = GeoJSON.Feature<
  GeoJSON.LineString | GeoJSON.MultiLineString,
  TrailProperties
>;

export type RouteFeature = GeoJSON.Feature<
  GeoJSON.LineString | GeoJSON.MultiLineString,
  RouteProperties
>;

export const TRAIL_CATEGORY_COLORS: Record<TrailCategory, string> = {
  [TrailCategory.Cycleway]: "#1565c0",
  [TrailCategory.BicycleRoute]: "#2e7d32",
  [TrailCategory.MtbTrail]: "#e65100",
  [TrailCategory.GravelTrack]: "#6d4c41",
  [TrailCategory.SharedPath]: "#7b1fa2",
};
