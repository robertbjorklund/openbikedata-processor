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
  MtbTrail = "mtb_trail",
}

export enum SourceType {
  OPENSTREETMAP = "openstreetmap",
}

export interface Source {
  type: SourceType;
  id: string;
}

import type { ElevationProfile } from "./ElevationProfile";

export type { ElevationData, ElevationProfile } from "./ElevationProfile";
export {
  extractPointsForElevationProfile,
  getElevationData,
  getProfileGeometry,
} from "./ElevationProfile";

export interface TrailProperties {
  type: FeatureType.Trail;
  id: string;
  /** Stable id for all segments of the same logical trail (name/ref group). */
  groupId: string | null;
  category: TrailCategory;
  name: string | null;
  ref: string | null;
  surface: string | null;
  smoothness: string | null;
  tracktype: string | null;
  mtbScale: number | null;
  /** IMBA difficulty 0–4 from mtb:scale:imba */
  mtbScaleImba: number | null;
  sacScale: string | null;
  bicycle: string | null;
  lit: boolean | null;
  oneway: boolean | null;
  network: string | null;
  lengthMeters: number | null;
  elevationProfile: ElevationProfile | null;
  status: Status;
  sources: Source[];
}

export interface RouteProperties {
  type: FeatureType.Route;
  id: string;
  /** Stable id for all segments of the same logical route (name/ref group). */
  groupId: string | null;
  /** One OSM route relation — a selectable stage within a group (e.g. Kustlinjen etapp). */
  stageId: string | null;
  name: string | null;
  ref: string | null;
  from: string | null;
  to: string | null;
  via: string | null;
  network: string | null;
  distance: string | null;
  roundtrip: boolean | null;
  /** Share of relation length on paved surfaces (0–1), from member ways */
  pavedRatio: number | null;
  elevationProfile: ElevationProfile | null;
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
