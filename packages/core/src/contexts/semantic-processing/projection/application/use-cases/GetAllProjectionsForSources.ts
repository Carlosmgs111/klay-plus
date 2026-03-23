import type { SemanticProjectionRepository } from "../../domain/SemanticProjectionRepository";
import type { ExistingProjectionInfo } from "./FindExistingProjection";

export class GetAllProjectionsForSources {
  constructor(
    private readonly _repository: SemanticProjectionRepository,
  ) {}

  async execute(sourceIds: string[]): Promise<Map<string, ExistingProjectionInfo[]>> {
    const result = new Map<string, ExistingProjectionInfo[]>();
    for (const sourceId of sourceIds) {
      const projections = await this._repository.findBySourceId(sourceId);
      const completed = projections
        .filter((p) => p.status === "COMPLETED")
        .map((p) => {
          const data = (p.result?.data ?? {}) as Record<string, unknown>;
          return {
            projectionId: p.id.value,
            processingProfileId: p.processingProfileId,
            chunksCount: (data.chunksCount as number) ?? 0,
            dimensions: (data.dimensions as number) ?? 0,
            model: (data.model as string) ?? "unknown",
          };
        });
      if (completed.length > 0) result.set(sourceId, completed);
    }
    return result;
  }
}
