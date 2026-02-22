import type { ContentManifestEntry } from "../domain/ContentManifest.js";

/**
 * Repository port for ContentManifest persistence.
 *
 * Allows the orchestrator to persist and query pipeline run records
 * that track cross-context associations.
 */
export interface ManifestRepository {
  /** Persist a manifest entry */
  save(manifest: ContentManifestEntry): Promise<void>;

  /** Find a manifest by its ID */
  findById(id: string): Promise<ContentManifestEntry | null>;

  /** Find all manifests for a given resource */
  findByResourceId(resourceId: string): Promise<ContentManifestEntry[]>;

  /** Find all manifests for a given source */
  findBySourceId(sourceId: string): Promise<ContentManifestEntry[]>;

  /** Retrieve all manifests */
  findAll(): Promise<ContentManifestEntry[]>;
}
