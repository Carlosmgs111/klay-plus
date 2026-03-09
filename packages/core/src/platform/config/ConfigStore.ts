/**
 * Write port for persistent configuration storage.
 *
 * Complements the read-only ConfigProvider with write, remove, and bulk-load
 * operations. Used to persist API keys and other runtime configuration.
 *
 * Implementations:
 * - InMemoryConfigStore: for tests
 * - IndexedDBConfigStore: for browser runtime
 * - NeDBConfigStore: for server runtime
 */
export interface ConfigStore {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  loadAll(): Promise<Record<string, string>>;
  has(key: string): Promise<boolean>;
}
