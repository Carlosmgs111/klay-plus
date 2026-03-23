import type { ContextRepository } from "../../domain/ContextRepository";
import type { SourceMetadataPort } from "../ports/SourceMetadataPort";
import type { ProjectionStatsPort } from "../ports/ProjectionStatsPort";
import type {
  GetContextDetailsResult,
  ContextSourceDetailDTO,
  ProjectionSummaryDTO,
  ListContextsSummaryResult,
  ListContextsResult,
  GetSourceContextsResult,
} from "../../../../../application/knowledge/dtos";
import { Result } from "../../../../../shared/domain/Result";
import { KnowledgeError } from "../../../../../application/knowledge/domain/KnowledgeError";
import { OperationStep } from "../../../../../application/knowledge/domain/OperationStep";
import { ContextId } from "../../domain/ContextId";

/**
 * ContextQueries — Consolidated read-side use cases for context-management.
 *
 * Merges: GetContext, ListContexts, GetContextsForSource, GetContextDetails, ListContextsSummary
 */
export class ContextQueries {
  constructor(
    private readonly _repo: ContextRepository,
    private readonly _sourceMeta: SourceMetadataPort,
    private readonly _projStats: ProjectionStatsPort,
  ) {}

  // From GetContext — raw aggregate for internal use (e.g. ProcessKnowledge)
  async getRaw(contextId: string) {
    return this._repo.findById(ContextId.create(contextId));
  }

  // From ListContexts — returns lightweight ContextRefDTO list
  async listRefs(): Promise<Result<KnowledgeError, ListContextsResult>> {
    try {
      const contexts = await this._repo.findAll();
      return Result.ok({
        contexts: contexts.map((c) => ({
          id: c.id.value,
          name: c.name,
          state: c.state,
          requiredProfileId: c.requiredProfileId,
        })),
        total: contexts.length,
      });
    } catch (error) {
      return Result.fail(KnowledgeError.fromStep(OperationStep.Cataloging, error, []));
    }
  }

  // From GetContextsForSource — returns ContextRefDTO[] filtered by sourceId
  async listBySource(sourceId: string): Promise<Result<KnowledgeError, GetSourceContextsResult>> {
    try {
      const contexts = await this._repo.findBySourceId(sourceId);
      return Result.ok({
        sourceId,
        contexts: contexts.map((c) => ({
          id: c.id.value,
          name: c.name,
          state: c.state,
          requiredProfileId: c.requiredProfileId,
        })),
      });
    } catch (error) {
      return Result.fail(KnowledgeError.fromStep(OperationStep.Cataloging, error, []));
    }
  }

  // From GetContextDetails — enriched, cross-context
  async getDetail(contextId: string): Promise<Result<KnowledgeError, GetContextDetailsResult>> {
    try {
      const context = await this._repo.findById(ContextId.create(contextId));
      if (!context) {
        throw { message: `Context ${contextId} not found`, code: "CONTEXT_NOT_FOUND" };
      }

      const activeSourceIds = context.activeSources.map((s) => s.sourceId);
      const allProjections = activeSourceIds.length > 0
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

  // From ListContextsSummary — enriched, cross-context
  async listSummary(): Promise<Result<KnowledgeError, ListContextsSummaryResult>> {
    try {
      const contexts = await this._repo.findAll();

      const summaries = await Promise.all(
        contexts.map(async (c) => {
          const activeSourceIds = c.activeSources.map((s) => s.sourceId);
          let projectionCount = 0;
          let requiredProfileCoverage = 0;

          if (activeSourceIds.length > 0) {
            const allProjections = await this._projStats.getAllProjectionsForSources(activeSourceIds);
            for (const [, projs] of allProjections) {
              projectionCount += projs.length;
              if (projs.some((p) => p.processingProfileId === c.requiredProfileId)) {
                requiredProfileCoverage++;
              }
            }
          }

          const sourceCount = activeSourceIds.length;
          // Status based on requiredProfile coverage
          let status: "empty" | "partial" | "complete";
          if (sourceCount === 0) status = "empty";
          else if (requiredProfileCoverage === sourceCount) status = "complete";
          else status = "partial";

          return {
            id: c.id.value,
            name: c.name,
            state: c.state,
            sourceCount,
            projectionCount,
            requiredProfileId: c.requiredProfileId,
            status,
          };
        }),
      );

      return Result.ok({ contexts: summaries });
    } catch (error) {
      return Result.fail(KnowledgeError.fromStep(OperationStep.Cataloging, error, []));
    }
  }
}
