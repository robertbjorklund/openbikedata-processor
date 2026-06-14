type LineFeature<P> = GeoJSON.Feature<GeoJSON.LineString, P>;

export default class PointMultiMap<P> {
  private readonly internal = new Map<string, Set<LineFeature<P>>>();

  addFeature(point: GeoJSON.Position, feature: LineFeature<P>) {
    this.get(point).add(feature);
  }

  getFeatures(point: GeoJSON.Position): LineFeature<P>[] {
    return [...this.get(point)];
  }

  private get(point: GeoJSON.Position) {
    const key = `${point[0].toFixed(7)}-${point[1].toFixed(7)}`;
    let bucket = this.internal.get(key);
    if (!bucket) {
      bucket = new Set();
      this.internal.set(key, bucket);
    }
    return bucket;
  }
}
