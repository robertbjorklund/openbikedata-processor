export class InMemoryCache<T> {
  private cache = new Map<string, T>();

  async initialize(): Promise<void> {}

  async close(): Promise<void> {
    this.cache.clear();
  }

  async getMany(keys: string[]): Promise<(T | undefined)[]> {
    return keys.map((key) => this.cache.get(key));
  }

  async setMany(entries: Array<{ key: string; value: T }>): Promise<void> {
    for (const entry of entries) {
      this.cache.set(entry.key, entry.value);
    }
  }
}
