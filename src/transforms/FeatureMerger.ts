import length from "@turf/length";
import {
  FeatureType,
  RouteFeature,
  RouteProperties,
  Source,
  TrailFeature,
  TrailProperties,
} from "../format";
import { stableFeatureId } from "./FeatureBuilder";

type LineCoords = GeoJSON.Position[];

function geometryToLines(
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString,
): LineCoords[] {
  if (geometry.type === "LineString") {
    return geometry.coordinates.length >= 2 ? [geometry.coordinates] : [];
  }
  return geometry.coordinates.filter((line) => line.length >= 2);
}

function linesToGeometry(
  lines: LineCoords[],
): GeoJSON.LineString | GeoJSON.MultiLineString {
  if (lines.length === 1) {
    return { type: "LineString", coordinates: lines[0] };
  }
  return { type: "MultiLineString", coordinates: lines };
}

function uniqueSources(sources: Source[]): Source[] {
  const byId = new Map<string, Source>();
  for (const source of sources) {
    byId.set(`${source.type}:${source.id}`, source);
  }
  return [...byId.values()];
}

export function getTrailGroupKey(properties: TrailProperties): string | null {
  if (properties.name) {
    return `name:${properties.name}|cat:${properties.category}`;
  }
  if (properties.ref) {
    return `ref:${properties.ref}|cat:${properties.category}`;
  }
  return null;
}

function mergeTrailGroup(
  groupKey: string,
  segments: TrailFeature[],
): TrailFeature {
  const lines = segments.flatMap((segment) => geometryToLines(segment.geometry));
  const geometry = linesToGeometry(lines);

  const primary = segments.reduce((best, segment) =>
    (segment.properties.lengthMeters ?? 0) > (best.properties.lengthMeters ?? 0)
      ? segment
      : best,
  );

  const totalLength = Math.round(
    length({ type: "Feature", properties: {}, geometry }, { units: "meters" }),
  );

  const properties: TrailProperties = {
    ...primary.properties,
    type: FeatureType.Trail,
    id: stableFeatureId("trail-group", groupKey),
    groupId: null,
    lengthMeters: totalLength,
    elevationProfile: null,
    sources: uniqueSources(segments.flatMap((segment) => segment.properties.sources)),
  };

  return {
    type: "Feature",
    geometry,
    properties,
  };
}

function normalizeRouteName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();
}

const GENERIC_ROUTE_NAMES = new Set([
  "bicycle route",
  "bike route",
  "cycle route",
  "cykelled",
  "cykelväg",
  "cykelbana",
]);

export function isGenericRouteName(name: string): boolean {
  return GENERIC_ROUTE_NAMES.has(normalizeRouteName(name));
}

function routeNetworkKey(network: string | null | undefined): string {
  return network?.trim().toLowerCase() || "none";
}

/** Link keys used to connect route segments (name and/or ref). */
export function getRouteLinkKeys(properties: RouteProperties): string[] {
  const keys: string[] = [];
  const network = routeNetworkKey(properties.network);
  const normalizedName = properties.name?.trim()
    ? normalizeRouteName(properties.name)
    : null;
  const hasDistinctName =
    normalizedName !== null &&
    normalizedName.length > 0 &&
    !isGenericRouteName(properties.name!);

  if (hasDistinctName && normalizedName) {
    keys.push(`name:${normalizedName}`);
  }

  if (properties.ref?.trim()) {
    const normalizedRef =
      normalizeRouteName(properties.ref) || properties.ref.trim().toLowerCase();
    const refBase = `ref:${network}:${normalizedRef}`;
    if (network === "icn" || network === "ncn") {
      keys.push(refBase);
    } else if (hasDistinctName && normalizedName) {
      keys.push(`${refBase}:${normalizedName}`);
    } else {
      keys.push(refBase);
    }
  }

  return keys;
}

export function getRouteGroupKey(properties: RouteProperties): string | null {
  const keys = getRouteLinkKeys(properties);
  return keys.find((key) => key.startsWith("name:")) ?? keys[0] ?? null;
}

class UnionFind {
  private parent: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, index) => index);
  }

  find(index: number): number {
    if (this.parent[index] !== index) {
      this.parent[index] = this.find(this.parent[index]);
    }
    return this.parent[index];
  }

  union(a: number, b: number): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) {
      this.parent[rootA] = rootB;
    }
  }
}

function routeGeometryMeters(feature: RouteFeature): number {
  return length(
    { type: "Feature", properties: {}, geometry: feature.geometry },
    { units: "meters" },
  );
}

function mergeRouteGroup(
  groupKey: string,
  segments: RouteFeature[],
): RouteFeature {
  const lines = segments.flatMap((segment) => geometryToLines(segment.geometry));
  const geometry = linesToGeometry(lines);

  const primary = segments.reduce((best, segment) =>
    routeGeometryMeters(segment) > routeGeometryMeters(best) ? segment : best,
  );

  const properties: RouteProperties = {
    ...primary.properties,
    type: FeatureType.Route,
    id: stableFeatureId("route-group", groupKey),
    groupId: null,
    sources: uniqueSources(
      segments.flatMap((segment) => segment.properties.sources),
    ),
  };

  return {
    type: "Feature",
    geometry,
    properties,
  };
}

export function mergeRoutesByGroup(features: RouteFeature[]): RouteFeature[] {
  const ungrouped: RouteFeature[] = [];
  const groupable: { feature: RouteFeature; keys: string[] }[] = [];

  for (const feature of features) {
    const keys = getRouteLinkKeys(feature.properties);
    if (keys.length === 0) {
      ungrouped.push(feature);
      continue;
    }
    groupable.push({ feature, keys });
  }

  if (groupable.length === 0) {
    return ungrouped;
  }

  const unionFind = new UnionFind(groupable.length);
  const keyToIndex = new Map<string, number>();

  for (let index = 0; index < groupable.length; index++) {
    for (const key of groupable[index].keys) {
      const existing = keyToIndex.get(key);
      if (existing !== undefined) {
        unionFind.union(index, existing);
      } else {
        keyToIndex.set(key, index);
      }
    }
  }

  const components = new Map<
    number,
    { features: RouteFeature[]; keys: Set<string> }
  >();

  for (let index = 0; index < groupable.length; index++) {
    const root = unionFind.find(index);
    const component = components.get(root) ?? {
      features: [],
      keys: new Set<string>(),
    };
    component.features.push(groupable[index].feature);
    for (const key of groupable[index].keys) {
      component.keys.add(key);
    }
    components.set(root, component);
  }

  const merged: RouteFeature[] = [...ungrouped];
  for (const { features: segments, keys } of components.values()) {
    const uniqueSegments = [
      ...new Map(segments.map((segment) => [segment.properties.id, segment]))
        .values(),
    ];
    if (uniqueSegments.length === 1) {
      merged.push(uniqueSegments[0]);
      continue;
    }
    const groupKey = [...keys].sort().join("|");
    merged.push(mergeRouteGroup(groupKey, uniqueSegments));
  }

  return merged;
}

export function mergeTrailsByGroup(features: TrailFeature[]): TrailFeature[] {
  const ungrouped: TrailFeature[] = [];
  const groups = new Map<string, TrailFeature[]>();

  for (const feature of features) {
    const key = getTrailGroupKey(feature.properties);
    if (!key) {
      ungrouped.push(feature);
      continue;
    }
    const group = groups.get(key) ?? [];
    group.push(feature);
    groups.set(key, group);
  }

  const merged: TrailFeature[] = [...ungrouped];
  for (const [key, segments] of groups) {
    merged.push(
      segments.length === 1 ? segments[0] : mergeTrailGroup(key, segments),
    );
  }

  return merged;
}
