import type { ContextRepository } from "../../domain/ContextRepository";
import type { EventPublisher } from "../../../../../shared/domain/EventPublisher";
import { ContextId } from "../../domain/ContextId";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";
import type { Context } from "../../domain/Context";
import { NotFoundError } from "../../../../../shared/domain/errors";

export class ContextNotFoundError extends NotFoundError {
  constructor(contextId: string) {
    super("Context", contextId);
  }
}

export class TransitionContextState {
  constructor(
    private readonly _repository: ContextRepository,
    private readonly _eventPublisher: EventPublisher,
  ) {}

  async execute(params: {
    contextId: string;
    action: "activate" | "deprecate" | "archive";
    reason?: string;
  }): Promise<Result<DomainError, Context>> {
    const context = await this._repository.findById(
      ContextId.create(params.contextId),
    );
    if (!context) {
      return Result.fail(new ContextNotFoundError(params.contextId));
    }

    switch (params.action) {
      case "activate":
        context.activate();
        break;
      case "deprecate":
        context.deprecate(params.reason ?? "");
        break;
      case "archive":
        context.archive();
        break;
    }

    await this._repository.save(context);
    await this._eventPublisher.publishAll(context.clearEvents());

    return Result.ok(context);
  }
}
