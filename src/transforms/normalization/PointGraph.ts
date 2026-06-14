import PointMultiMap from "./PointMultiMap";

type LineFeature<P> = GeoJSON.Feature<GeoJSON.LineString, P>;

enum Direction {
  Forward,
  Backward,
  Both,
}

export default class PointGraph<P extends object> {
  private readonly inbound = new PointMultiMap<P>();
  private readonly outbound = new PointMultiMap<P>();
  private readonly processed = new Set<LineFeature<P>>();

  constructor(
    private readonly isSameSegment: (
      left: LineFeature<P>,
      right: LineFeature<P>,
    ) => boolean,
    private readonly mergeProperties: (properties: P[]) => P,
  ) {}

  addFeature(feature: LineFeature<P>) {
    this.outbound.addFeature(headPoint(feature), feature);
    this.inbound.addFeature(tailPoint(feature), feature);
  }

  merge(feature: LineFeature<P>): LineFeature<P> | null {
    const features = this.expand(feature, Direction.Both);
    if (features.length === 0) {
      return null;
    }

    const coordinates = features.reduce((acc: GeoJSON.Position[], entry) => {
      let segmentCoords = entry.feature.geometry.coordinates;
      if (entry.reversed) {
        segmentCoords = [...segmentCoords].reverse();
      }
      if (acc.length > 0) {
        if (!positionsEqual(segmentCoords[0], acc[acc.length - 1])) {
          throw new Error("mismatched coords in PointGraph");
        }
        segmentCoords = segmentCoords.slice(1);
      }
      return acc.concat(segmentCoords);
    }, []);

    return {
      type: "Feature",
      geometry: { type: "LineString", coordinates },
      properties: this.mergeProperties(features.map((entry) => entry.feature.properties)),
    };
  }

  private expandInReverse(
    feature: LineFeature<P> | null,
    direction: Direction,
  ): { feature: LineFeature<P>; reversed: boolean }[] {
    if (
      !feature ||
      isOneway(feature) ||
      this.processed.has(feature)
    ) {
      return [];
    }
    return this.expand(feature, direction, true);
  }

  private expand(
    feature: LineFeature<P> | null,
    direction: Direction,
    reversed = false,
  ): { feature: LineFeature<P>; reversed: boolean }[] {
    if (!feature || this.processed.has(feature)) {
      return [];
    }
    this.processed.add(feature);

    const head = reversed ? tailPoint(feature) : headPoint(feature);
    const tail = reversed ? headPoint(feature) : tailPoint(feature);
    const features: { feature: LineFeature<P>; reversed: boolean }[] = [];
    const featureMatcher = (other: LineFeature<P>) =>
      feature !== other && this.isSameSegment(feature, other);

    if (direction !== Direction.Forward) {
      const inbound = this.expand(
        this.inbound.getFeatures(head).find(featureMatcher) ?? null,
        Direction.Backward,
      );
      features.push(...inbound);
      if (inbound.length === 0) {
        features.push(
          ...this.expandInReverse(
            this.outbound.getFeatures(head).find(featureMatcher) ?? null,
            Direction.Backward,
          ),
        );
      }
    }

    features.push({ feature, reversed });

    if (direction !== Direction.Backward) {
      const outbound = this.expand(
        this.outbound.getFeatures(tail).find(featureMatcher) ?? null,
        Direction.Forward,
      );
      features.push(...outbound);
      if (outbound.length === 0) {
        features.push(
          ...this.expandInReverse(
            this.inbound.getFeatures(tail).find(featureMatcher) ?? null,
            Direction.Forward,
          ),
        );
      }
    }

    return features;
  }
}

function headPoint(feature: GeoJSON.Feature<GeoJSON.LineString>) {
  return feature.geometry.coordinates[0];
}

function tailPoint(feature: GeoJSON.Feature<GeoJSON.LineString>) {
  const coords = feature.geometry.coordinates;
  return coords[coords.length - 1];
}

function positionsEqual(a: GeoJSON.Position, b: GeoJSON.Position): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

function isOneway<P extends object>(feature: LineFeature<P>): boolean {
  return (feature.properties as { oneway?: boolean | null }).oneway === true;
}
