import type { ContextRepository } from "../../domain/ContextRepository";
import type { ProjectionStatsPort } from "../ports/ProjectionStatsPort";
import type { ListContextsSummaryResult } from "../../../../../application/knowledge/dtos";
import { Result } from "../../../../../shared/domain/Result";
import { KnowledgeError } from "../../../../../application/knowledge/domain/KnowledgeError";
import { OperationStep } from "../../../../../application/knowledge/domain/OperationStep";

/**
 * ListContextsSummary — Use case owned by context-management bounded context.
 *
 * Returns enriched summaries for all contexts, joining context state from
 * ContextRepository with projection statistics (ProjectionStatsPort).
 */
export class ListContextsSummary {
  constructor(
    private readonly _contextRepository: ContextRepository,
    private readonly _projectionStats: ProjectionStatsPort,
  ) {}

  async execute(): Promise<Result<KnowledgeError, ListContextsSummaryResult>> {
    try {
      const contexts = await this._contextRepository.findAll();

      const summaries = await Promise.all(
        contexts.map(async (c) => {
          const activeSourceIds = c.activeSources.map((s) => s.sourceId);
          let projectionCount = 0;
          let requiredProfileCoverage = 0;

          if (activeSourceIds.length > 0) {
            const allProjections = await this._projectionStats.getAllProjectionsForSources(activeSourceIds);
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
