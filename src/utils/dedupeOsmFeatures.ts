import OSMGeoJSONProperties, { osmID } from "../features/OSMGeoJSONProperties";

/** Keep one feature per OSM object (relation/way/node). Grid overlap may return duplicates. */
export function dedupeOsmFeatures(
  features: GeoJSON.Feature[],
): GeoJSON.Feature[] {
  const seen = new Map<string, GeoJSON.Feature>();
  let unkeyed = 0;

  for (const feature of features) {
    const props = feature.properties as
      | OSMGeoJSONProperties<Record<string, unknown>>
      | undefined;
    const key =
      props?.type !== undefined && props.id !== undefined
        ? osmID(props)
        : `unkeyed-${unkeyed++}`;

    if (!seen.has(key)) {
      seen.set(key, feature);
    }
  }

  return [...seen.values()];
}
