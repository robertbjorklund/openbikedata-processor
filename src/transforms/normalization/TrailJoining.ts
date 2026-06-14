import {
  FeatureType,
  Source,
  TrailProperties,
  type TrailFeature,
} from "../../format";

const IGNORED_FOR_COMPARISON = new Set<keyof TrailProperties>([
  "id",
  "groupId",
  "sources",
  "elevationProfile",
  "lengthMeters",
]);

export function isPartOfSameTrail(
  left: TrailFeature,
  right: TrailFeature,
): boolean {
  return propertiesEqualForJoining(left.properties, right.properties);
}

function propertiesEqualForJoining(
  left: TrailProperties,
  right: TrailProperties,
): boolean {
  const leftKeys = Object.keys(left) as (keyof TrailProperties)[];
  for (const key of leftKeys) {
    if (IGNORED_FOR_COMPARISON.has(key)) {
      continue;
    }
    if (left[key] !== right[key]) {
      return false;
    }
  }
  return true;
}

export function mergedTrailProperties(
  allProperties: TrailProperties[],
): TrailProperties {
  if (allProperties.length === 0) {
    throw new Error("No input properties");
  }

  const primary = allProperties[0];
  const names = uniqueNonEmpty(allProperties.map((p) => p.name));
  const refs = uniqueNonEmpty(allProperties.map((p) => p.ref));

  return {
    ...primary,
    type: FeatureType.Trail,
    name: names.length === 1 ? names[0] : names.join(", ") || null,
    ref: refs.length === 1 ? refs[0] : refs.join(", ") || null,
    sources: uniqueSources(allProperties.flatMap((p) => p.sources)),
    elevationProfile: null,
    lengthMeters: null,
    groupId: primary.groupId,
  };
}

function uniqueNonEmpty(values: (string | null)[]): string[] {
  return [...new Set(values.filter((value): value is string => !!value?.trim()))];
}

function uniqueSources(sources: Source[]): Source[] {
  const byId = new Map<string, Source>();
  for (const source of sources) {
    byId.set(`${source.type}:${source.id}`, source);
  }
  return [...byId.values()];
}
