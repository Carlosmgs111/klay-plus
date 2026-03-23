import type { KnowledgeLineageRepository } from "../../domain/KnowledgeLineageRepository";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";
import { OperationError } from "../../../../../shared/domain/errors";

export class LineageOperationError extends OperationError {
  constructor(operation: string, reason: string) {
    super(operation, reason);
  }
}

export class UnlinkContexts {
  constructor(
    private readonly _repository: KnowledgeLineageRepository,
  ) {}

  async execute(params: {
    fromContextId: string;
    toContextId: string;
  }): Promise<Result<DomainError, { fromContextId: string; toContextId: string }>> {
    try {
      const lineage = await this._repository.findByContextId(params.fromContextId);

      if (!lineage) {
        return Result.fail(
          new LineageOperationError(
            "unlinkContexts",
            `No lineage found for context ${params.fromContextId}`,
          ),
        );
      }

      const removed = lineage.removeTrace(params.fromContextId, params.toContextId);

      if (!removed) {
        return Result.fail(
          new LineageOperationError(
            "unlinkContexts",
            `Link not found: ${params.fromContextId} --> ${params.toContextId}`,
          ),
        );
      }

      await this._repository.save(lineage);

      return Result.ok({
        fromContextId: params.fromContextId,
        toContextId: params.toContextId,
      });
    } catch (error) {
      return Result.fail(
        new LineageOperationError("unlinkContexts", String(error)),
      );
    }
  }
}
