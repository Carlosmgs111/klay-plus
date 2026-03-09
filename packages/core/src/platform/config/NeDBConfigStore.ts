import type { ConfigStore } from "./ConfigStore";
import { NeDBStore } from "../persistence/nedb/NeDBStore";

/**
 * Server-side ConfigStore backed by NeDB.
 * Persists configuration (API keys, URIs, credentials) to a local file.
 */
export class NeDBConfigStore implements ConfigStore {
  private readonly store: NeDBStore<string>;

  constructor(dbPath?: string) {
    const filename = dbPath ? `${dbPath}/config.db` : undefined;
    this.store = new NeDBStore<string>(filename);
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
