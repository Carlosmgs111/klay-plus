import type { SemanticProjectionRepository } from "../../domain/SemanticProjectionRepository";
import type { VectorWriteStore } from "../../domain/ports/VectorWriteStore";

export type CleanupProjectionsInput =
  | { sourceId: string; profileId?: undefined }   // all profiles
  | { sourceId: string; profileId: string };        // specific profile

/**
 * CleanupProjections — Consolidated cleanup use case for semantic-processing projections.
 *
 * Merges: CleanupSourceProjections (all profiles) + CleanupSourceProjectionForProfile (specific profile)
 */
export class CleanupProjections {
  constructor(
    private readonly _repository: SemanticProjectionRepository,
    private readonly _vectorStore: VectorWriteStore,
  ) {}

  async execute(input: CleanupProjectionsInput): Promise<string | null | void> {
    if (input.profileId !== undefined) {
      // From CleanupSourceProjectionForProfile — specific profile
      return this._cleanupForProfile(input.sourceId, input.profileId);
    } else {
      // From CleanupSourceProjections — all profiles
      return this._cleanupAll(input.sourceId);
    }
  }

  /** Delete only the projection (and its vectors) for a specific profile. Returns deleted projection ID or null. */
  private async _cleanupForProfile(sourceId: string, profileId: string): Promise<string | null> {
    const projection = await this._repository.findBySourceIdAndProfileId(sourceId, profileId);
    if (!projection) return null;
    await this._vectorStore.deleteByProjectionId(projection.id.value);
    await this._repository.delete(projection.id);
    return projection.id.value;
  }

  /** Delete all projections and vector entries for a source. */
  private async _cleanupAll(sourceId: string): Promise<void> {
    await this._repository.deleteBySourceId(sourceId);
    await this._vectorStore.deleteBySourceId(sourceId);
  }
}
