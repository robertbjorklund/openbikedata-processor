import type { RouteProperties } from "../format";

export const SVERIGELEDEN_BASE = "sverigeleden";

export type SverigeledenSection = "norra" | "mellersta" | "sodra";

export type QualifierKind = "annotation" | "stageRef" | "leg" | null;

export interface RouteStageParse {
  effectiveName: string | null;
  qualifierKind: QualifierKind;
  qualifier: string | null;
}

export const SVERIGELEDEN_SECTION_LABELS: Record<SverigeledenSection, string> = {
  norra: "Norra Sverigeleden",
  mellersta: "Mellersta Sverigeleden",
  sodra: "Södra Sverigeleden",
};

function normalizeRef(ref: string): string {
  return ref
    .trim()
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/\s+/g, " ");
}

/** Sweden by Bike etapp ranges for Sverigeleden NCN sections. */
export function getSverigeledenSection(
  stageNum: number,
): SverigeledenSection | null {
  if (stageNum >= 1 && stageNum <= 13) {
    return "norra";
  }
  if (stageNum >= 14 && stageNum <= 28) {
    return "mellersta";
  }
  if (stageNum >= 29 && stageNum <= 39) {
    return "sodra";
  }
  return null;
}

export function getRouteStageNumber(
  properties: RouteProperties,
  parsed: RouteStageParse | null,
): number | null {
  if (parsed?.qualifierKind === "stageRef" && parsed.qualifier) {
    const fromQualifier = Number.parseInt(parsed.qualifier, 10);
    if (Number.isFinite(fromQualifier)) {
      return fromQualifier;
    }
  }

  if (parsed?.effectiveName === SVERIGELEDEN_BASE && properties.ref?.trim()) {
    const refNorm = normalizeRef(properties.ref);
    if (/^\d+$/.test(refNorm)) {
      return Number.parseInt(refNorm, 10);
    }
  }

  return null;
}

export function getSverigeledenSectionForRoute(
  properties: RouteProperties,
  parsed: RouteStageParse | null,
): SverigeledenSection | null {
  if (parsed?.effectiveName !== SVERIGELEDEN_BASE) {
    return null;
  }
  const stageNum = getRouteStageNumber(properties, parsed);
  if (stageNum === null) {
    return null;
  }
  return getSverigeledenSection(stageNum);
}
