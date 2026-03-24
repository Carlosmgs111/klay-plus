import type { ContextRepository } from "../../domain/ContextRepository";
import type { EventPublisher } from "../../../../../shared/domain/EventPublisher";
import { Context } from "../../domain/Context";
import { ContextId } from "../../domain/ContextId";
import { ContextMetadata } from "../../domain/ContextMetadata";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

/**
 * CreateContextAndActivate — creates a context in Draft state, then auto-activates it.
 *
 * This is a context-management policy: new contexts go Active immediately
 * for a low-friction UX. Belongs here because both steps are internal to
 * this bounded context.
 */
export class CreateContextAndActivate {
  constructor(
    private readonly _repository: ContextRepository,
    private readonly _eventPublisher: EventPublisher,
  ) {}

  async execute(params: {
    id: string;
    name: string;
    description: string;
    language: string;
    requiredProfileId: string;
    createdBy: string;
    tags?: string[];
    attributes?: Record<string, string>;
  }): Promise<Result<DomainError, Context>> {
    const metadata = ContextMetadata.create(
      params.createdBy,
      params.tags,
      params.attributes,
    );

    const context = Context.create(
      ContextId.create(params.id),
      params.name,
      params.description,
      params.language,
      params.requiredProfileId,
      metadata,
    );

    // Auto-activate (Draft → Active)
    context.activate();

    await this._repository.save(context);
    await this._eventPublisher.publishAll(context.clearEvents());

    return Result.ok(context);
  }
}
