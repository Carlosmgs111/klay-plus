import type { SecretStore } from "./SecretStore";

export class SecretResolver {
  constructor(private readonly _store: SecretStore) {}

  /** Resolve a secret from store, then env vars. Returns undefined if not found. */
  async resolve(key: string): Promise<string | undefined> {
    // 1. SecretStore (primary)
    const fromStore = await this._store.get(key);
    if (fromStore !== undefined) return fromStore;

    // 2. Environment variables (server-only — in browser, process is undefined)
    if (typeof process !== "undefined" && process.env) {
      const fromEnv = process.env[key];
      if (fromEnv !== undefined && fromEnv !== "") return fromEnv;
    }

    return undefined;
  }

  /** Resolve or throw a descriptive error */
  async require(key: string): Promise<string> {
    const value = await this.resolve(key);
    if (value === undefined) {
      throw new Error(
        `Missing credential: "${key}". Set it via the dashboard (Credentials) or as an environment variable.`
      );
    }
    return value;
  }

  /** Resolve multiple keys, returning only those that exist */
  async resolveMultiple(keys: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    for (const key of keys) {
      const value = await this.resolve(key);
      if (value !== undefined) result[key] = value;
    }
    return result;
  }
}
