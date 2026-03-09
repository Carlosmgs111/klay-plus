import type { ConfigStore } from "@klay/core/config";

/**
 * Extended ConfigStore with batch save + reinitialize capability.
 * Used by SettingsPage to type-check server-mode operations.
 */
export interface BatchConfigStore extends ConfigStore {
  saveAndReinitialize(entries: Record<string, string>): Promise<void>;
}

/**
 * ConfigStore proxy that calls /api/config routes.
 * Used by the UI in server mode to read/write credentials on the server.
 */
export class ServerConfigService implements BatchConfigStore {
  async get(key: string): Promise<string | undefined> {
    const all = await this.loadAll();
    return all[key];
  }

  async set(key: string, value: string): Promise<void> {
    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: { [key]: value } }),
    });
    if (!res.ok) {
      throw new Error(`Failed to set config key "${key}": ${res.status}`);
    }
  }

  async remove(key: string): Promise<void> {
    const res = await fetch("/api/config", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    if (!res.ok) {
      throw new Error(`Failed to remove config key "${key}": ${res.status}`);
    }
  }

  async loadAll(): Promise<Record<string, string>> {
    const res = await fetch("/api/config");
    if (!res.ok) {
      throw new Error(`Failed to load config: ${res.status}`);
    }
    return res.json();
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  async saveAndReinitialize(entries: Record<string, string>): Promise<void> {
    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries, reinitialize: true }),
    });
    if (!res.ok) {
      throw new Error(`Failed to save and reinitialize: ${res.status}`);
    }
  }
}
