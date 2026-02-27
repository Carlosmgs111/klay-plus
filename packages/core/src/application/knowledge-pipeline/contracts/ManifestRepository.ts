import type { ContentManifestEntry } from "../domain/ContentManifest.js";

/**
 * Repository port for ContentManifest persistence.
 *
 * Allows the orchestrator to persist and query pipeline run records
 * that track cross-context associations.
 */
export interface ManifestRepository {
  save(manifest: ContentManifestEntry): Promise<void>;

  findById(id: string): Promise<ContentManifestEntry | null>;

  findByResourceId(resourceId: string): Promise<ContentManifestEntry[]>;

  findBySourceId(sourceId: string): Promise<ContentManifestEntry[]>;

  findBySemanticUnitId(semanticUnitId: string): Promise<ContentManifestEntry[]>;

  /** Retrieve all manifests */
  findAll(): Promise<ContentManifestEntry[]>;
}
