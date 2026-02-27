import type { ContentManifestEntry } from "../domain/ContentManifest";
import type { ManifestRepository } from "../contracts/ManifestRepository";

export class InMemoryManifestRepository implements ManifestRepository {
  private store = new Map<string, ContentManifestEntry>();

  async save(manifest: ContentManifestEntry): Promise<void> {
    this.store.set(manifest.id, manifest);
  }

  async findById(id: string): Promise<ContentManifestEntry | null> {
    return this.store.get(id) ?? null;
  }

  async findByResourceId(resourceId: string): Promise<ContentManifestEntry[]> {
    return [...this.store.values()].filter((m) => m.resourceId === resourceId);
  }

  async findBySourceId(sourceId: string): Promise<ContentManifestEntry[]> {
    return [...this.store.values()].filter((m) => m.sourceId === sourceId);
  }

  async findBySemanticUnitId(semanticUnitId: string): Promise<ContentManifestEntry[]> {
    return [...this.store.values()].filter((m) => m.semanticUnitId === semanticUnitId);
  }

  async findAll(): Promise<ContentManifestEntry[]> {
    return [...this.store.values()];
  }
}
