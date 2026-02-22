import type { ContentManifestEntry } from "../../domain/ContentManifest.js";
import type { ManifestRepository } from "../../contracts/ManifestRepository.js";

/**
 * Internal use case for persisting a content manifest.
 * Called by ExecuteFullPipeline after each pipeline run.
 */
export class RecordManifest {
  constructor(private readonly repository: ManifestRepository) {}

  async execute(entry: ContentManifestEntry): Promise<void> {
    await this.repository.save(entry);
  }
}
