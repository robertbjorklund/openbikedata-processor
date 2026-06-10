import { Status } from "../format";

export default function getStatusAndValue(
  key: string,
  properties: { [key: string]: string },
): { status: Status | null; value: string | null } {
  if (isUnsupportedStatus(key, properties)) {
    return { status: null, value: null };
  }

  if (Object.prototype.hasOwnProperty.call(properties, key)) {
    const valueOrStatus = properties[key];
    if (lifecycleStates.has(valueOrStatus as Status)) {
      return {
        status: valueOrStatus as Status,
        value: properties[valueOrStatus] || null,
      };
    }
  } else {
    for (const state of Array.from(lifecycleStates)) {
      const lifecycleKey = getLifecycleKey(key, state);
      if (Object.prototype.hasOwnProperty.call(properties, lifecycleKey)) {
        return {
          status: state,
          value: properties[lifecycleKey] || null,
        };
      }
    }
  }

  let status = Status.Operating;
  for (const state of Array.from(lifecycleStates)) {
    if (properties[state] === "yes") {
      status = state;
      break;
    }
  }

  return {
    status,
    value: properties[key] || null,
  };
}

function isUnsupportedStatus(
  key: string,
  properties: { [key: string]: string },
): boolean {
  return (
    unsupportedStates.has(properties[key]) ||
    Array.from(unsupportedStates).some((state) => properties[state] === "yes")
  );
}

const unsupportedStates = new Set(["demolished", "removed", "razed"]);

const lifecycleStates = new Set([
  Status.Disused,
  Status.Abandoned,
  Status.Proposed,
  Status.Planned,
  Status.Construction,
]);

function getLifecycleKey(originalKey: string, status: Status): string {
  switch (status) {
    case Status.Disused:
      return "disused:" + originalKey;
    case Status.Abandoned:
      return "abandoned:" + originalKey;
    case Status.Proposed:
      return "proposed:" + originalKey;
    case Status.Planned:
      return "planned:" + originalKey;
    case Status.Construction:
      return "construction:" + originalKey;
    default:
      return originalKey;
  }
}
