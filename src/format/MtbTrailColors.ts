import { TrailCategory } from "./index";

export const MTB_TRAIL_COLOR_GREEN = "#2e7d32";
export const MTB_TRAIL_COLOR_BLUE = "#1565c0";
export const MTB_TRAIL_COLOR_RED = "#d32f2f";
export const MTB_TRAIL_COLOR_BLACK = "#000000";
export const TRAIL_COLOR_OTHER = "#7b1fa2";

export function mtbTrailColor(mtbScale: number | null): string {
  if (mtbScale === null) {
    return TRAIL_COLOR_OTHER;
  }
  if (mtbScale <= 1) {
    return MTB_TRAIL_COLOR_GREEN;
  }
  if (mtbScale === 2) {
    return MTB_TRAIL_COLOR_BLUE;
  }
  if (mtbScale === 3) {
    return MTB_TRAIL_COLOR_RED;
  }
  return MTB_TRAIL_COLOR_BLACK;
}

export function trailColor(
  category: TrailCategory,
  mtbScale: number | null,
): string {
  if (category !== TrailCategory.MtbTrail) {
    return TRAIL_COLOR_OTHER;
  }
  return mtbTrailColor(mtbScale);
}
