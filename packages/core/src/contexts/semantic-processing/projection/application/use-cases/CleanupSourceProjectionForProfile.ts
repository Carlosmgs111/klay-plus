import type { SemanticProjectionRepository } from "../../domain/SemanticProjectionRepository";
import type { VectorWriteStore } from "../../domain/ports/VectorWriteStore";

export class CleanupSourceProjectionForProfile {
  constructor(
    private readonly _repository: SemanticProjectionRepository,
    private readonly _vectorStore: VectorWriteStore,
  ) {}

  /** Delete only the projection (and its vectors) for a specific profile. Returns deleted projection ID or null. */
  async execute(sourceId: string, profileId: string): Promise<string | null> {
    const projection = await this._repository.findBySourceIdAndProfileId(sourceId, profileId);
    if (!projection) return null;
    await this._vectorStore.deleteByProjectionId(projection.id.value);
    await this._repository.delete(projection.id);
    return projection.id.value;
  }
}
