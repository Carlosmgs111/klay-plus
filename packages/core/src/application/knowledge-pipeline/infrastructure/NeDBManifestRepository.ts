import type { ContentManifestEntry } from "../domain/ContentManifest.js";
import type { ManifestRepository } from "../contracts/ManifestRepository.js";

export class NeDBManifestRepository implements ManifestRepository {
  private store: import("../../../platform/persistence/nedb/NeDBStore").NeDBStore<ContentManifestEntry> | null = null;
  private readonly filename?: string;

  constructor(filename?: string) {
    this.filename = filename;
  }

  private async getStore() {
    if (!this.store) {
      const { NeDBStore } = await import(
        "../../../platform/persistence/nedb/NeDBStore"
      );
      this.store = new NeDBStore<ContentManifestEntry>(this.filename);
    }
    return this.store;
  }

  async save(manifest: ContentManifestEntry): Promise<void> {
    const store = await this.getStore();
    await store.put(manifest.id, manifest);
  }

  async findById(id: string): Promise<ContentManifestEntry | null> {
    const store = await this.getStore();
    return store.get(id);
  }

  async findByResourceId(resourceId: string): Promise<ContentManifestEntry[]> {
    const store = await this.getStore();
    return store.find((m) => m.resourceId === resourceId);
  }

  async findBySourceId(sourceId: string): Promise<ContentManifestEntry[]> {
    const store = await this.getStore();
    return store.find((m) => m.sourceId === sourceId);
  }

  async findAll(): Promise<ContentManifestEntry[]> {
    const store = await this.getStore();
    return store.getAll();
  }
}
