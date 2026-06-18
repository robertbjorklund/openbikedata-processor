import { readAllFeatures } from "../io/GeoJSONRewrite";
import { isSupportedOsmRoute } from "./OsmRouteTypes";

export type OsmWayRelationRef = {
  rel: number;
  reltags?: { route?: string };
};

export type RouteMemberWayIndex = ReadonlySet<number>;

export function isSupportedRouteMemberRelation(
  relation: OsmWayRelationRef,
): boolean {
  return (
    relation.reltags !== undefined && isSupportedOsmRoute(relation.reltags)
  );
}

/** True when an OSM way is a member of a bicycle or MTB route relation. */
export function wayIsRouteMember(
  properties: {
    type?: string;
    id?: number;
    relations?: OsmWayRelationRef[];
  },
  routeMemberWayIds: RouteMemberWayIndex = new Set(),
): boolean {
  if (properties.type !== "way" || typeof properties.id !== "number") {
    return false;
  }

  if (routeMemberWayIds.has(properties.id)) {
    return true;
  }

  return (
    properties.relations?.some(isSupportedRouteMemberRelation) ?? false
  );
}

/** Way ids that belong to signed bicycle or MTB route relations (from routes download). */
export async function buildRouteMemberWayIds(
  inputRoutesPath: string,
): Promise<Set<number>> {
  const features = await readAllFeatures(inputRoutesPath);
  const wayIds = new Set<number>();

  for (const feature of features) {
    const properties = feature.properties as {
      type?: string;
      id?: number;
      relations?: OsmWayRelationRef[];
    };

    if (
      properties.type === "way" &&
      typeof properties.id === "number" &&
      wayIsRouteMember(properties)
    ) {
      wayIds.add(properties.id);
    }
  }

  return wayIds;
}
