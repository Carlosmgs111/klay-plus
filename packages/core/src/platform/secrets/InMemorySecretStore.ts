import type { SecretStore } from "./SecretStore";
import type { SecretMetadata, ManagedSecretSummary } from "./ManagedSecret";

interface StoredEntry {
  value: string;
  metadata: SecretMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export class InMemorySecretStore implements SecretStore {
  private readonly _entries = new Map<string, StoredEntry>();

  constructor(initial?: Record<string, string>) {
    if (initial) {
      const now = new Date();
      for (const [key, value] of Object.entries(initial)) {
        this._entries.set(key, { value, metadata: {}, createdAt: now, updatedAt: now });
      }
    }
  }

  async set(key: string, value: string, metadata?: SecretMetadata): Promise<void> {
    const now = new Date();
    const existing = this._entries.get(key);
    this._entries.set(key, {
      value,
      metadata: metadata ?? existing?.metadata ?? {},
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }

  async get(key: string): Promise<string | undefined> {
    return this._entries.get(key)?.value;
  }

  async exists(key: string): Promise<boolean> {
    return this._entries.has(key);
  }

  async remove(key: string): Promise<void> {
    this._entries.delete(key);
  }

  async list(): Promise<ManagedSecretSummary[]> {
    return Array.from(this._entries.entries()).map(([key, entry]) => ({
      key,
      name: entry.metadata.name,
      category: entry.metadata.category,
      scope: entry.metadata.scope ?? "global",
      provider: entry.metadata.provider,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));
  }

  async getMetadata(key: string): Promise<SecretMetadata | undefined> {
    const entry = this._entries.get(key);
    return entry ? { ...entry.metadata } : undefined;
  }

  async getMultiple(keys: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    for (const key of keys) {
      const value = this._entries.get(key)?.value;
      if (value !== undefined) result[key] = value;
    }
    return result;
  }
}
