/** OSM bicycle route network colors — keep in sync with openbikemap.org RouteNetwork.ts */
export const ROUTE_NETWORK_COLOR_ICN = "#b71c1c";
export const ROUTE_NETWORK_COLOR_NCN = "#c62828";
export const ROUTE_NETWORK_COLOR_RCN = "#e65100";
export const ROUTE_NETWORK_COLOR_LCN = "#2e7d32";
export const ROUTE_NETWORK_DEFAULT_COLOR = "#1565c0";

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
