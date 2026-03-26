import type { KnowledgeLineageRepository } from "../../domain/KnowledgeLineageRepository";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

// ── Boundary DTOs ────────────────────────────────────────────────────

export interface GetContextLineageInput {
  contextId: string;
}

export interface GetContextLineageResult {
  contextId: string;
  traces: Array<{
    fromContextId: string;
    toContextId: string;
    relationship: string;
    createdAt: string;
  }>;
}

/**
 * LineageQueries — Consolidated read-side use cases for context-management lineage.
 *
 * Merges: GetLineage
 */
export class LineageQueries {
  constructor(
    private readonly _repository: KnowledgeLineageRepository,
  ) {}

  async getLineage(
    contextId: string,
  ): Promise<Result<DomainError, { contextId: string; traces: Array<{ fromContextId: string; toContextId: string; relationship: string; createdAt: Date }> }>> {
    const lineage = await this._repository.findByContextId(contextId);
    if (!lineage) {
      return Result.ok({ contextId, traces: [] });
    }
    return Result.ok({
      contextId,
      traces: lineage.traces.map((t) => ({
        fromContextId: t.fromContextId,
        toContextId: t.toContextId,
        relationship: t.relationship,
        createdAt: t.createdAt,
      })),
    });
  }
}
