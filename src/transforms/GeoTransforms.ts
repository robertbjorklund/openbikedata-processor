import booleanValid from "@turf/boolean-valid";
import OSMGeoJSONProperties from "../features/OSMGeoJSONProperties";

export function isValidGeometryInFeature(
  feature: GeoJSON.Feature<GeoJSON.Geometry, OSMGeoJSONProperties<{}>>,
): boolean {
  try {
    if (!booleanValid(feature.geometry)) {
      console.warn(
        `Invalid geometry: https://www.openstreetmap.org/${feature.properties.type}/${feature.properties.id}`,
      );
      return false;
    }
    return true;
  } catch (e) {
    console.warn(
      `Geometry validation error: https://www.openstreetmap.org/${feature.properties.type}/${feature.properties.id} - ${e}`,
    );
    return false;
  }
}
