import {
  RouteFeature,
  RouteProperties,
  TrailFeature,
  TrailProperties,
} from "../format";
import { stableFeatureId } from "./FeatureBuilder";
import { getRouteLinkKeys } from "./FeatureMerger";

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

function trailGroupIdKey(properties: TrailProperties): string | null {
  const name = properties.name?.trim();
  if (name) {
    return `name:${name.toLowerCase()}|cat:${properties.category}`;
  }
  const ref = properties.ref?.trim();
  if (ref) {
    return `ref:${ref.toLowerCase()}|cat:${properties.category}`;
  }
  return null;
}

export function assignTrailGroupIds(features: TrailFeature[]): TrailFeature[] {
  const keyToGroupId = new Map<string, string>();

  return features.map((feature) => {
    const key = trailGroupIdKey(feature.properties);
    if (!key) {
      return feature;
    }
    let groupId = keyToGroupId.get(key);
    if (!groupId) {
      groupId = stableFeatureId("trail-logical-group", key);
      keyToGroupId.set(key, groupId);
    }
    if (feature.properties.groupId === groupId) {
      return feature;
    }
    return {
      ...feature,
      properties: {
        ...feature.properties,
        groupId,
      },
    };
  });
}

export function assignRouteGroupIds(features: RouteFeature[]): RouteFeature[] {
  const groupable: { feature: RouteFeature; keys: string[]; index: number }[] =
    [];

  features.forEach((feature, index) => {
    const keys = getRouteLinkKeys(feature.properties);
    if (keys.length > 0) {
      groupable.push({ feature, keys, index });
    }
  });

  if (groupable.length === 0) {
    return features;
  }

  const unionFind = new UnionFind(groupable.length);
  const keyToIndex = new Map<string, number>();

  groupable.forEach(({ keys }, index) => {
    for (const key of keys) {
      const existing = keyToIndex.get(key);
      if (existing !== undefined) {
        unionFind.union(index, existing);
      } else {
        keyToIndex.set(key, index);
      }
    }
  });

  const rootToGroupId = new Map<number, string>();
  const rootToKeys = new Map<number, Set<string>>();

  groupable.forEach(({ keys }, index) => {
    const root = unionFind.find(index);
    const keySet = rootToKeys.get(root) ?? new Set<string>();
    for (const key of keys) {
      keySet.add(key);
    }
    rootToKeys.set(root, keySet);
  });

  for (const [root, keys] of rootToKeys) {
    rootToGroupId.set(
      root,
      stableFeatureId("route-logical-group", [...keys].sort().join("|")),
    );
  }

  const indexToGroupId = new Map<number, string>();
  groupable.forEach((entry, index) => {
    indexToGroupId.set(entry.index, rootToGroupId.get(unionFind.find(index))!);
  });

  return features.map((feature, index) => {
    const groupId = indexToGroupId.get(index) ?? null;
    if (!groupId || feature.properties.groupId === groupId) {
      return feature;
    }
    return {
      ...feature,
      properties: {
        ...feature.properties,
        groupId,
      },
    };
  });
}

export function assignRouteGroupIdsToProperties(
  properties: RouteProperties,
  groupId: string | null,
): RouteProperties {
  return { ...properties, groupId };
}

export { trailGroupIdKey };
