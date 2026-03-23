import type { SemanticProjectionRepository } from "../../domain/SemanticProjectionRepository";

export interface ExistingProjectionInfo {
  projectionId: string;
  processingProfileId: string;
  chunksCount: number;
  dimensions: number;
  model: string;
}

/**
 * ProjectionQueries — Consolidated read-side use cases for semantic-processing projections.
 *
 * Merges: FindExistingProjection, GetProjectionsForSources, GetAllProjectionsForSources
 */
export class ProjectionQueries {
  constructor(
    private readonly _repo: SemanticProjectionRepository,
  ) {}

  // From FindExistingProjection — single source + profile lookup
  async findExisting(sourceId: string, profileId: string): Promise<ExistingProjectionInfo | null> {
    const projection = await this._repo.findBySourceIdAndProfileId(sourceId, profileId);
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

  // From GetProjectionsForSources — batch lookup for a specific profile
  async listForSources(sourceIds: string[], profileId: string): Promise<Map<string, ExistingProjectionInfo>> {
    const result = new Map<string, ExistingProjectionInfo>();
    for (const sourceId of sourceIds) {
      const info = await this.findExisting(sourceId, profileId);
      if (info) result.set(sourceId, info);
    }
    return result;
  }

  // From GetAllProjectionsForSources — batch lookup across all profiles
  async listAllForSources(sourceIds: string[]): Promise<Map<string, ExistingProjectionInfo[]>> {
    const result = new Map<string, ExistingProjectionInfo[]>();
    for (const sourceId of sourceIds) {
      const projections = await this._repo.findBySourceId(sourceId);
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
