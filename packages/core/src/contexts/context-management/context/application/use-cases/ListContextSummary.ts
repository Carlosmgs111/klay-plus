import type { ContextRepository } from "../../domain/ContextRepository";
import type { ProjectionStatsPort } from "../ports/ProjectionStatsPort";
import { Result } from "../../../../../shared/domain/Result";

export interface EnrichedContextSummaryDTO {
  id: string;
  name: string;
  state: string;
  sourceCount: number;
  projectionCount: number;
  requiredProfileId: string;
  status: "empty" | "partial" | "complete";
}

export interface ListContextsSummaryResult {
  contexts: EnrichedContextSummaryDTO[];
}
import { type StepError, stepError } from "../../../../../shared/domain/errors/stepError";

/**
 * ListContextSummary — enriched read use case.
 *
 * Composes context list with projection statistics via port.
 */
export class ListContextSummary {
  constructor(
    private readonly _repo: ContextRepository,
    private readonly _projStats: ProjectionStatsPort,
  ) {}

  async execute(): Promise<Result<StepError, ListContextsSummaryResult>> {
    try {
      const contexts = await this._repo.findAll();

      const summaries = await Promise.all(
        contexts.map(async (c) => {
          const activeSourceIds = c.activeSources.map((s) => s.sourceId);
          let projectionCount = 0;
          let requiredProfileCoverage = 0;

          if (activeSourceIds.length > 0) {
            const allProjections =
              await this._projStats.getAllProjectionsForSources(activeSourceIds);
            for (const [, projs] of allProjections) {
              projectionCount += projs.length;
              if (projs.some((p) => p.processingProfileId === c.requiredProfileId)) {
                requiredProfileCoverage++;
              }
            }
          }

          const sourceCount = activeSourceIds.length;
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
      return Result.fail(stepError("cataloging", error));
    }
  }
}
