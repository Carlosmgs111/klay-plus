import type { SemanticProjectionRepository } from "../../domain/SemanticProjectionRepository";
import type { VectorWriteStore } from "../../domain/ports/VectorWriteStore";

export class CleanupSourceProjections {
  constructor(
    private readonly _repository: SemanticProjectionRepository,
    private readonly _vectorStore: VectorWriteStore,
  ) {}

  /** Delete all projections and vector entries for a source. */
  async execute(sourceId: string): Promise<void> {
    await this._repository.deleteBySourceId(sourceId);
    await this._vectorStore.deleteBySourceId(sourceId);
  }
}
