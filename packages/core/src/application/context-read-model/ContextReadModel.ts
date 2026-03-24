import type { ContextQueries } from "../../contexts/context-management/context/application/use-cases/ContextQueries";
import type { SourceMetadataPort } from "../ports/SourceMetadataPort";
import type { ProjectionStatsPort } from "../ports/ProjectionStatsPort";
import type {
  GetContextDetailsResult,
  ContextSourceDetailDTO,
  ProjectionSummaryDTO,
  ListContextsSummaryResult,
} from "../dtos";
import { Result } from "../../shared/domain/Result";
import { type StepError, stepError } from "../../shared/domain/errors/stepError";

/**
 * ContextReadModel — Application-layer enriched read model.
 *
 * Composes data from 3 contexts:
 * - Context base data (context-management)
 * - Source metadata (source-ingestion)
 * - Projection statistics (semantic-processing)
 *
 * This is NOT domain logic — it's read-side composition for consumers.
 */
export interface ContextReadModelDeps {
  contextQueries: ContextQueries;
  sourceMetadata: SourceMetadataPort;
  projectionStats: ProjectionStatsPort;
}

export class ContextReadModel {
  constructor(private readonly _deps: ContextReadModelDeps) {}

  async getDetail(
    contextId: string,
  ): Promise<Result<StepError, GetContextDetailsResult>> {
    try {
      const context = await this._deps.contextQueries.getRaw(contextId);
      if (!context) {
        throw {
          message: `Context ${contextId} not found`,
          code: "CONTEXT_NOT_FOUND",
        };
      }

      const activeSourceIds = context.activeSources.map((s) => s.sourceId);
      const allProjections =
        activeSourceIds.length > 0
          ? await this._deps.projectionStats.getAllProjectionsForSources(
              activeSourceIds,
            )
          : new Map<string, never[]>();

      const sources: ContextSourceDetailDTO[] = await Promise.all(
        context.activeSources.map(async (cs) => {
          const source = await this._deps.sourceMetadata.getSourceMetadata(
            cs.sourceId,
          );
          const sourceProjections = allProjections.get(cs.sourceId) ?? [];

          const projections: ProjectionSummaryDTO[] = sourceProjections.map(
            (p) => ({
              projectionId: p.projectionId,
              processingProfileId: p.processingProfileId,
              chunksCount: p.chunksCount,
              dimensions: p.dimensions,
              model: p.model,
            }),
          );

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

  async listSummary(): Promise<
    Result<StepError, ListContextsSummaryResult>
  > {
    try {
      const contextsResult = await this._deps.contextQueries.listRefs();
      if (contextsResult.isFail()) {
        return contextsResult as Result<StepError, never>;
      }

      // Need raw contexts for source data — use getRaw for each
      const allContexts = await Promise.all(
        contextsResult.value.contexts.map((ref) =>
          this._deps.contextQueries.getRaw(ref.id),
        ),
      );

      const summaries = await Promise.all(
        allContexts
          .filter((c) => c !== null)
          .map(async (c) => {
            const activeSourceIds = c!.activeSources.map((s) => s.sourceId);
            let projectionCount = 0;
            let requiredProfileCoverage = 0;

            if (activeSourceIds.length > 0) {
              const allProjections =
                await this._deps.projectionStats.getAllProjectionsForSources(
                  activeSourceIds,
                );
              for (const [, projs] of allProjections) {
                projectionCount += projs.length;
                if (
                  projs.some(
                    (p) =>
                      p.processingProfileId === c!.requiredProfileId,
                  )
                ) {
                  requiredProfileCoverage++;
                }
              }
            }

            const sourceCount = activeSourceIds.length;
            let status: "empty" | "partial" | "complete";
            if (sourceCount === 0) status = "empty";
            else if (requiredProfileCoverage === sourceCount)
              status = "complete";
            else status = "partial";

            return {
              id: c!.id.value,
              name: c!.name,
              state: c!.state,
              sourceCount,
              projectionCount,
              requiredProfileId: c!.requiredProfileId,
              status,
            };
          }),
      );

      return Result.ok({ contexts: summaries });
    } catch (error) {
      return Result.fail(stepError("cataloging", error));
    }
  }
}
