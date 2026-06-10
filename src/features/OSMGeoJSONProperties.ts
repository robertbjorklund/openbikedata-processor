export interface OSMIdentifiable {
  type: string;
  id: number;
}

export default interface OSMGeoJSONProperties<Tags> extends OSMIdentifiable {
  tags: Tags;
}

export function osmID(properties: OSMIdentifiable): string {
  return properties.type + "/" + properties.id;
}
