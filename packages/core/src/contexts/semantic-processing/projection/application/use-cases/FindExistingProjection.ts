import type { SemanticProjectionRepository } from "../../domain/SemanticProjectionRepository";

export interface ExistingProjectionInfo {
  projectionId: string;
  processingProfileId: string;
  chunksCount: number;
  dimensions: number;
  model: string;
}

export class FindExistingProjection {
  constructor(
    private readonly _repository: SemanticProjectionRepository,
  ) {}

  async execute(sourceId: string, profileId: string): Promise<ExistingProjectionInfo | null> {
    const projection = await this._repository.findBySourceIdAndProfileId(sourceId, profileId);
    if (!projection || projection.status !== "COMPLETED") return null;
    const data = (projection.result?.data ?? {}) as Record<string, unknown>;
    return {
      projectionId: projection.id.value,
      processingProfileId: projection.processingProfileId,
      chunksCount: (data.chunksCount as number) ?? 0,
      dimensions: (data.dimensions as number) ?? 0,
      model: (data.model as string) ?? "unknown",
    };
  }
}
