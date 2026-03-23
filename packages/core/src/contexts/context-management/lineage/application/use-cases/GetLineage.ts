import type { KnowledgeLineageRepository } from "../../domain/KnowledgeLineageRepository";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

export class GetLineage {
  constructor(
    private readonly _repository: KnowledgeLineageRepository,
  ) {}

  async execute(
    input: { contextId: string },
  ): Promise<Result<DomainError, { contextId: string; traces: Array<{ fromContextId: string; toContextId: string; relationship: string; createdAt: Date }> }>> {
    const lineage = await this._repository.findByContextId(input.contextId);
    if (!lineage) {
      return Result.ok({ contextId: input.contextId, traces: [] });
    }
    return Result.ok({
      contextId: input.contextId,
      traces: lineage.traces.map((t) => ({
        fromContextId: t.fromContextId,
        toContextId: t.toContextId,
        relationship: t.relationship,
        createdAt: t.createdAt,
      })),
    });
  }
}
