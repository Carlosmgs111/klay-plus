import type { ConfigStore } from "./ConfigStore";

/**
 * In-memory ConfigStore for testing.
 */
export class InMemoryConfigStore implements ConfigStore {
  private readonly store: Map<string, string>;

  constructor(initial: Record<string, string> = {}) {
    this.store = new Map(Object.entries(initial));
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }

  async loadAll(): Promise<Record<string, string>> {
    return Object.fromEntries(this.store);
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }
}
