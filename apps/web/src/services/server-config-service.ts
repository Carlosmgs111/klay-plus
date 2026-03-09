import type { ConfigStore } from "@klay/core/config";

/**
 * ConfigStore proxy that calls /api/config routes.
 * Used by the UI in server mode to read/write credentials on the server.
 */
export class ServerConfigService implements ConfigStore {
  async get(key: string): Promise<string | undefined> {
    const all = await this.loadAll();
    return all[key];
  }

  async set(key: string, value: string): Promise<void> {
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: { [key]: value } }),
    });
  }

  async remove(key: string): Promise<void> {
    await fetch("/api/config", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
  }

  async loadAll(): Promise<Record<string, string>> {
    const res = await fetch("/api/config");
    return res.json();
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  /**
   * Batch-save entries and reinitialize the server pipeline.
   */
  async saveAndReinitialize(entries: Record<string, string>): Promise<void> {
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries, reinitialize: true }),
    });
  }
}
