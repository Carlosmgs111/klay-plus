// ── ConfigStore (Port) ────────────────────────────────────────────────

export interface ConfigStore {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  loadAll(): Promise<Record<string, string>>;
  has(key: string): Promise<boolean>;
}

// ── InMemoryConfigStore ──────────────────────────────────────────────

export class InMemoryConfigStore implements ConfigStore {
  private readonly store: Map<string, string>;

  constructor(initial: Record<string, string> = {}) {
    this.store = new Map(Object.entries(initial));
  }

  async get(key: string): Promise<string | undefined> {
    return this.store.get(key);
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

// ── IndexedDBConfigStore ─────────────────────────────────────────────

import { IndexedDBStore } from "../persistence/indexeddb/IndexedDBStore";

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

// ── NeDBConfigStore ──────────────────────────────────────────────────

import { NeDBStore } from "../persistence/nedb/NeDBStore";

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
