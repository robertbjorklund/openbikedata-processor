import { mtbRouteColor } from "./MtbRouteColors";
import { routeNetworkColor } from "./RouteNetworkColors";
import type { OsmRouteType } from "./index";

/** Map line color for a route feature in MVT tiles. */
export function routeLineColor(
  osmRouteType: OsmRouteType,
  network: string | null,
  osmColour: string | null,
): string {
  if (osmRouteType === "mtb") {
    return mtbRouteColor(osmColour);
  }
  return routeNetworkColor(network);
}
