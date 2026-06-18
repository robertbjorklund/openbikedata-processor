import { RouteProperties } from "../format";

export type QualifierKind = "annotation" | "stageRef" | "leg" | null;

export interface ParsedRouteDisplayName {
  base: string | null;
  qualifier: string | null;
  qualifierKind: QualifierKind;
  /** Normalized name used for `name:{net}:…` link keys (R3). */
  effectiveName: string | null;
}

const ANNOTATION_WORDS = new Set([
  "planerat",
  "planned",
  "proposed",
  "under construction",
  "under konstruktion",
  "construction",
  "disused",
  "abandoned",
]);

const STAGE_REF_PATTERN = /^(\d+[a-z]?|ev\d+)$/i;

export const GENERIC_ROUTE_NAMES = new Set([
  "bicycle route",
  "bike route",
  "cycle route",
  "cykelled",
  "cykelväg",
  "cykelbana",
]);

export function normalizeRouteText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function classifyQualifier(rawQualifier: string): Exclude<QualifierKind, null> {
  const normalized = normalizeRouteText(rawQualifier);
  if (ANNOTATION_WORDS.has(normalized)) {
    return "annotation";
  }
  if (STAGE_REF_PATTERN.test(rawQualifier.trim())) {
    return "stageRef";
  }
  return "leg";
}

export function parseRouteDisplayName(
  name: string | null | undefined,
): ParsedRouteDisplayName | null {
  if (!name?.trim()) {
    return null;
  }

  const normalizedFull = normalizeRouteText(name);
  const match = normalizedFull.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!match) {
    return {
      base: normalizedFull,
      qualifier: null,
      qualifierKind: null,
      effectiveName: normalizedFull,
    };
  }

  const base = normalizeRouteText(match[1]);
  const qualifier = normalizeRouteText(match[2]);
  const qualifierKind = classifyQualifier(match[2]);

  if (qualifierKind === "annotation") {
    return {
      base,
      qualifier,
      qualifierKind,
      effectiveName: base,
    };
  }

  if (qualifierKind === "stageRef") {
    return {
      base,
      qualifier: normalizeRouteRef(match[2]),
      qualifierKind,
      effectiveName: base,
    };
  }

  return {
    base,
    qualifier,
    qualifierKind,
    effectiveName: normalizedFull,
  };
}

/** @deprecated Prefer parseRouteDisplayName; strips trailing parenthesis for search helpers. */
export function normalizeRouteName(name: string): string {
  return parseRouteDisplayName(name)?.effectiveName ?? normalizeRouteText(name);
}

export function normalizeRouteRef(ref: string): string {
  return normalizeRouteText(ref.replace(/\s*\([^)]*\)\s*$/, ""));
}

export function isGenericRouteName(name: string): boolean {
  const effective = parseRouteDisplayName(name)?.effectiveName;
  if (!effective) {
    return false;
  }
  return GENERIC_ROUTE_NAMES.has(effective);
}

function routeNetworkKey(network: string | null | undefined): string {
  return network?.trim().toLowerCase() || "none";
}

function isDistinctEffectiveName(
  parsed: ParsedRouteDisplayName | null,
): parsed is ParsedRouteDisplayName & { effectiveName: string } {
  return (
    parsed?.effectiveName !== null &&
    parsed?.effectiveName !== undefined &&
    parsed.effectiveName.length > 0 &&
    !GENERIC_ROUTE_NAMES.has(parsed.effectiveName)
  );
}

function routeScopeKey(properties: RouteProperties): string {
  return `${properties.osmRouteType}:${routeNetworkKey(properties.network)}`;
}

/** Link keys used to connect route stages into one groupId. See docs/ROUTE-GROUPING.md */
export function getRouteLinkKeys(properties: RouteProperties): string[] {
  const keys: string[] = [];
  const net = routeScopeKey(properties);
  const networkOnly = routeNetworkKey(properties.network);
  const parsed = parseRouteDisplayName(properties.name);
  const refNorm = properties.ref?.trim()
    ? normalizeRouteRef(properties.ref)
    : null;
  const distinctName = isDistinctEffectiveName(parsed);

  if (refNorm) {
    const isIcnNcn = networkOnly === "icn" || networkOnly === "ncn";
    if (isIcnNcn) {
      keys.push(`ref:${net}:${refNorm}`);
    } else if (parsed?.qualifierKind === "stageRef") {
      keys.push(`ref:${net}:${refNorm}`);
    } else if (parsed?.qualifierKind === "leg") {
      // R1b — legs are not merged by ref alone
    } else if (distinctName) {
      keys.push(`ref:${net}:${refNorm}:${parsed.effectiveName}`);
    } else {
      keys.push(`ref:${net}:${refNorm}`);
    }
  }

  if (
    parsed?.qualifierKind === "stageRef" &&
    parsed.qualifier &&
    (!refNorm || refNorm === parsed.qualifier)
  ) {
    keys.push(`ref:${net}:${parsed.qualifier}`);
  }

  if (distinctName) {
    keys.push(`name:${net}:${parsed.effectiveName}`);
  }

  if (parsed?.qualifierKind === "leg" && parsed.base && parsed.qualifier) {
    keys.push(`leg:${net}:${parsed.base}:${parsed.qualifier}`);
  }

  return [...new Set(keys)];
}

export function getRouteGroupKey(properties: RouteProperties): string | null {
  const keys = getRouteLinkKeys(properties);
  return (
    keys.find((key) => key.startsWith("name:")) ??
    keys.find((key) => key.startsWith("leg:")) ??
    keys[0] ??
    null
  );
}
