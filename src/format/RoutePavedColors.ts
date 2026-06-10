export const ROUTE_PAVED_COLOR_0_20 = "#795548";
export const ROUTE_PAVED_COLOR_21_40 = "#a1887f";
export const ROUTE_PAVED_COLOR_41_60 = "#7d9471";
export const ROUTE_PAVED_COLOR_61_80 = "#607d8b";
export const ROUTE_PAVED_COLOR_81_100 = "#9e9e9e";
export const ROUTE_PAVED_COLOR_UNKNOWN = "#bdbdbd";

export function routePavedColor(pavedRatio: number | null): string {
  if (pavedRatio === null) {
    return ROUTE_PAVED_COLOR_UNKNOWN;
  }
  if (pavedRatio <= 0.2) {
    return ROUTE_PAVED_COLOR_0_20;
  }
  if (pavedRatio <= 0.4) {
    return ROUTE_PAVED_COLOR_21_40;
  }
  if (pavedRatio <= 0.6) {
    return ROUTE_PAVED_COLOR_41_60;
  }
  if (pavedRatio <= 0.8) {
    return ROUTE_PAVED_COLOR_61_80;
  }
  return ROUTE_PAVED_COLOR_81_100;
}
