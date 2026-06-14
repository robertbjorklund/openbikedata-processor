/** OSM bicycle route network colors — keep in sync with openbikemap.org RouteNetwork.ts */
export const EUROVELO_ROUTE_COLOR = "#003399";
export const ROUTE_NETWORK_COLOR_ICN = "#0d47a1";
export const ROUTE_NETWORK_COLOR_NCN = "#d32f2f";
export const ROUTE_NETWORK_COLOR_RCN = "#42a5f5";
export const ROUTE_NETWORK_COLOR_LCN = "#2e7d32";
export const ROUTE_NETWORK_DEFAULT_COLOR = "#7b1fa2";

const NETWORK_COLORS: Record<string, string> = {
  icn: ROUTE_NETWORK_COLOR_ICN,
  ncn: ROUTE_NETWORK_COLOR_NCN,
  rcn: ROUTE_NETWORK_COLOR_RCN,
  lcn: ROUTE_NETWORK_COLOR_LCN,
};

export function routeNetworkColor(network: string | null): string {
  if (!network) {
    return ROUTE_NETWORK_DEFAULT_COLOR;
  }
  return NETWORK_COLORS[network] ?? ROUTE_NETWORK_DEFAULT_COLOR;
}
