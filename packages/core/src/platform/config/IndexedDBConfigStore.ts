import type { ConfigStore } from "./ConfigStore";
import { IndexedDBStore } from "../persistence/indexeddb/IndexedDBStore";

/**
 * Browser-side ConfigStore backed by IndexedDB.
 */
export class IndexedDBConfigStore implements ConfigStore {
  private readonly store: IndexedDBStore<string>;

  constructor(dbName = "klay-config") {
    this.store = new IndexedDBStore<string>(dbName, "config");
  }

  async get(key: string): Promise<string | undefined> {
    return this.store.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.store.put(key, value);
  }

  async remove(key: string): Promise<void> {
    await this.store.remove(key);
  }

  async loadAll(): Promise<Record<string, string>> {
    const pairs = await this.store.entries();
    return Object.fromEntries(pairs);
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }
}
