import type { ContextRepository } from "../../domain/ContextRepository";
import type { SourceMetadataPort } from "../ports/SourceMetadataPort";
import type { ProjectionStatsPort } from "../ports/ProjectionStatsPort";
import type {
  GetContextDetailsInput,
  GetContextDetailsResult,
  ContextSourceDetailDTO,
  ProjectionSummaryDTO,
} from "../../../../../application/knowledge/dtos";
import { Result } from "../../../../../shared/domain/Result";
import { KnowledgeError } from "../../../../../application/knowledge/domain/KnowledgeError";
import { OperationStep } from "../../../../../application/knowledge/domain/OperationStep";
import { ContextId } from "../../domain/ContextId";

/**
 * GetContextDetails — Use case owned by context-management bounded context.
 *
 * Retrieves full details for a single context, joining context state from
 * ContextRepository with source metadata (SourceMetadataPort) and
 * projection statistics (ProjectionStatsPort).
 */
export class GetContextDetails {
  constructor(
    private readonly _contextRepository: ContextRepository,
    private readonly _sourceMetadata: SourceMetadataPort,
    private readonly _projectionStats: ProjectionStatsPort,
  ) {}

  async execute(
    input: GetContextDetailsInput,
  ): Promise<Result<KnowledgeError, GetContextDetailsResult>> {
    try {
      const context = await this._contextRepository.findById(ContextId.create(input.contextId));
      if (!context) {
        throw { message: `Context ${input.contextId} not found`, code: "CONTEXT_NOT_FOUND" };
      }

      const activeSourceIds = context.activeSources.map((s) => s.sourceId);
      const allProjections = activeSourceIds.length > 0
        ? await this._projectionStats.getAllProjectionsForSources(activeSourceIds)
        : new Map<string, never[]>();

      const sources: ContextSourceDetailDTO[] = await Promise.all(
        context.activeSources.map(async (cs) => {
          const source = await this._sourceMetadata.getSourceMetadata(cs.sourceId);
          const sourceProjections = allProjections.get(cs.sourceId) ?? [];

          const projections: ProjectionSummaryDTO[] = sourceProjections.map((p) => ({
            projectionId: p.projectionId,
            processingProfileId: p.processingProfileId,
            chunksCount: p.chunksCount,
            dimensions: p.dimensions,
            model: p.model,
          }));

          // Backward compat: fields from projection matching requiredProfile
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

      // Status based on requiredProfile coverage (backward compat)
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
      return Result.fail(KnowledgeError.fromStep(OperationStep.Cataloging, error, []));
    }
  }
}
