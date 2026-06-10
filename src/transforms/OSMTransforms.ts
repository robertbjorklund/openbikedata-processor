import unique from "../utils/unique";

export function mapOSMNumber(input: string | undefined): number | null {
  if (input === undefined) {
    return null;
  }
  const number = Number(input);
  return isNaN(number) ? null : number;
}

export function mapOSMBoolean(input: string | undefined): boolean | null {
  switch (input) {
    case "yes":
      return true;
    case "no":
      return false;
    default:
      return null;
  }
}

export function mapOSMString(input: string | undefined): string | null {
  return input === undefined ? null : input;
}

type OSMTags = Record<string, string | undefined>;

export function getOSMName<Properties extends OSMTags>(
  properties: Properties,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = properties[key];
    if (value) {
      return value;
    }
  }
  return null;
}

export function getOSMRef<Properties extends OSMTags>(
  properties: Properties,
): string | null {
  return mapOSMString(properties.ref);
}

export function getOrElse<Properties extends OSMTags>(
  properties: Properties,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = properties[key];
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
}

export function getOSMFirstValue<Properties extends OSMTags>(
  properties: Properties,
  key: string,
): string | null {
  const input = properties[key];
  if (input === undefined) {
    return null;
  }
  return input.split(";")[0];
}

export function sortedNameKeys<Properties extends OSMTags>(
  properties: Properties,
  ...rootKeys: string[]
): string[] {
  const keys: string[] = [];
  for (const rootKey of rootKeys) {
    for (const key of Object.keys(properties)) {
      if (key === rootKey || key.startsWith(rootKey + ":")) {
        keys.push(key);
      }
    }
  }
  return unique(keys).sort();
}
