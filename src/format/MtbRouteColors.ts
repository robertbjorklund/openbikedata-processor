/** Default line color for route=mtb relations without a parseable OSM colour. */
export const MTB_ROUTE_DEFAULT_COLOR = "#795548";

const NAMED_OSM_COLOURS: Record<string, string> = {
  red: "#d32f2f",
  blue: "#1565c0",
  green: "#2e7d32",
  black: "#000000",
  white: "#bdbdbd",
  yellow: "#fbc02d",
  orange: "#ff9800",
  purple: "#7b1fa2",
  pink: "#e91e63",
  brown: "#795548",
  grey: "#757575",
  gray: "#757575",
};

/** Parse OSM `colour` / `colour:back` values to hex when possible. */
export function parseOsmColour(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (/^#[0-9a-f]{3,8}$/i.test(normalized)) {
    return normalized;
  }

  return NAMED_OSM_COLOURS[normalized] ?? null;
}

export function mtbRouteColor(osmColour: string | null | undefined): string {
  return parseOsmColour(osmColour) ?? MTB_ROUTE_DEFAULT_COLOR;
}
