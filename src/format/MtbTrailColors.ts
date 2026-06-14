export const MTB_TRAIL_COLOR_GREEN = "#2e7d32";
export const MTB_TRAIL_COLOR_BLUE = "#1565c0";
export const MTB_TRAIL_COLOR_RED = "#d32f2f";
export const MTB_TRAIL_COLOR_BLACK = "#000000";
/** Double-diamond (S5–S6, IMBA 4) */
export const MTB_TRAIL_COLOR_ORANGE = "#ff9800";
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
  if (mtbScale === 4) {
    return MTB_TRAIL_COLOR_BLACK;
  }
  return MTB_TRAIL_COLOR_ORANGE;
}
