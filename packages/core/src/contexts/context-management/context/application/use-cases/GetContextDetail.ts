import type { ContextRepository } from "../../domain/ContextRepository";
import type { SourceMetadataPort } from "../ports/SourceMetadataPort";
import type { ProjectionStatsPort } from "../ports/ProjectionStatsPort";
import type {
  GetContextDetailsResult,
  ContextSourceDetailDTO,
  ProjectionSummaryDTO,
} from "../../../dtos";
import { Result } from "../../../../../shared/domain/Result";
import { type StepError, stepError } from "../../../../../shared/domain/errors/stepError";
import { ContextId } from "../../domain/ContextId";

/**
 * GetContextDetail — enriched read use case.
 *
 * Composes context data with source metadata and projection statistics
 * from other contexts via explicit ports.
 */
export class GetContextDetail {
  constructor(
    private readonly _repo: ContextRepository,
    private readonly _sourceMeta: SourceMetadataPort,
    private readonly _projStats: ProjectionStatsPort,
  ) {}

  async execute(contextId: string): Promise<Result<StepError, GetContextDetailsResult>> {
    try {
      const context = await this._repo.findById(ContextId.create(contextId));
      if (!context) {
        throw { message: `Context ${contextId} not found`, code: "CONTEXT_NOT_FOUND" };
      }

      const activeSourceIds = context.activeSources.map((s) => s.sourceId);
      const allProjections =
        activeSourceIds.length > 0
          ? await this._projStats.getAllProjectionsForSources(activeSourceIds)
          : new Map<string, never[]>();

      const sources: ContextSourceDetailDTO[] = await Promise.all(
        context.activeSources.map(async (cs) => {
          const source = await this._sourceMeta.getSourceMetadata(cs.sourceId);
          const sourceProjections = allProjections.get(cs.sourceId) ?? [];

          const projections: ProjectionSummaryDTO[] = sourceProjections.map((p) => ({
            projectionId: p.projectionId,
            processingProfileId: p.processingProfileId,
            chunksCount: p.chunksCount,
            dimensions: p.dimensions,
            model: p.model,
          }));

          const requiredProj = sourceProjections.find(
            (p) => p.processingProfileId === context.requiredProfileId,
          );

          return {
            sourceId: cs.sourceId,
            sourceName: source?.name ?? cs.sourceId,
            sourceType: source?.type ?? "unknown",
            projections,
            projectionId: requiredProj?.projectionId ?? cs.projectionId,
            chunksCount: requiredProj?.chunksCount,
            dimensions: requiredProj?.dimensions,
            model: requiredProj?.model,
            addedAt: cs.addedAt.toISOString(),
          };
        }),
      );

      const versions = context.versions.map((v) => ({
        version: v.version,
        sourceIds: [...v.sourceIds],
        reason: v.reason,
        createdAt: v.createdAt.toISOString(),
      }));

      const projectionCount = sources.filter((s) => s.projectionId).length;
      let status: "empty" | "partial" | "complete";
      if (sources.length === 0) status = "empty";
      else if (projectionCount === sources.length) status = "complete";
      else status = "partial";

      return Result.ok({
        contextId: context.id.value,
        name: context.name,
        state: context.state,
        requiredProfileId: context.requiredProfileId,
        sources,
        versions,
        status,
      });
    } catch (error) {
      return Result.fail(stepError("cataloging", error));
    }
  }
}
