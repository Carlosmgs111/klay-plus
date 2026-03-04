import type { ContentManifestEntry } from "../domain/ContentManifest";
import type { ManifestRepository } from "../contracts/ManifestRepository";
import { IndexedDBStore } from "../../../platform/persistence/indexeddb/IndexedDBStore";

export class IndexedDBManifestRepository implements ManifestRepository {
  private store: IndexedDBStore<ContentManifestEntry>;

  constructor(dbName: string = "knowledge-platform") {
    this.store = new IndexedDBStore<ContentManifestEntry>(dbName, "manifests");
  }

  async save(manifest: ContentManifestEntry): Promise<void> {
    await this.store.put(manifest.id, manifest);
  }

  async findById(id: string): Promise<ContentManifestEntry | null> {
    return (await this.store.get(id)) ?? null;
  }

  async findByResourceId(resourceId: string): Promise<ContentManifestEntry[]> {
    const all = await this.store.getAll();
    return all.filter((m) => m.resourceId === resourceId);
  }

  async findBySourceId(sourceId: string): Promise<ContentManifestEntry[]> {
    const all = await this.store.getAll();
    return all.filter((m) => m.sourceId === sourceId);
  }

  async findByContextId(contextId: string): Promise<ContentManifestEntry[]> {
    const all = await this.store.getAll();
    return all.filter((m) => m.contextId === contextId);
  }

  async findAll(): Promise<ContentManifestEntry[]> {
    return this.store.getAll();
  }
}
