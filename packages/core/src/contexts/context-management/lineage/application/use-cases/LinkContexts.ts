import type { KnowledgeLineageRepository } from "../../domain/KnowledgeLineageRepository";
import { KnowledgeLineage } from "../../domain/KnowledgeLineage";
import { LineageId } from "../../domain/LineageId";
import { Trace } from "../../domain/Trace";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";
import { OperationError } from "../../../../../shared/domain/errors";

export class LineageOperationError extends OperationError {
  constructor(operation: string, reason: string) {
    super(operation, reason);
  }
}

export class LinkContexts {
  constructor(
    private readonly _repository: KnowledgeLineageRepository,
  ) {}

  async execute(params: {
    fromContextId: string;
    toContextId: string;
    relationship: string;
  }): Promise<Result<DomainError, { fromContextId: string; toContextId: string }>> {
    try {
      if (params.fromContextId === params.toContextId) {
        return Result.fail(
          new LineageOperationError("linkContexts", "Cannot link a context to itself"),
        );
      }

      let lineage = await this._repository.findByContextId(params.fromContextId);

      if (!lineage) {
        const lineageId = LineageId.create(crypto.randomUUID());
        lineage = KnowledgeLineage.create(lineageId, params.fromContextId);
      }

      const duplicate = lineage.traces.some(
        (t) =>
          t.fromContextId === params.fromContextId &&
          t.toContextId === params.toContextId &&
          t.relationship === params.relationship,
      );

      if (duplicate) {
        return Result.fail(
          new LineageOperationError(
            "linkContexts",
            `Link already exists: ${params.fromContextId} --[${params.relationship}]--> ${params.toContextId}`,
          ),
        );
      }

      const trace = Trace.create(
        params.fromContextId,
        params.toContextId,
        params.relationship,
      );

      lineage.addTrace(trace);

      await this._repository.save(lineage);

      return Result.ok({
        fromContextId: params.fromContextId,
        toContextId: params.toContextId,
      });
    } catch (error) {
      return Result.fail(
        new LineageOperationError("linkContexts", String(error)),
      );
    }
  }
}
