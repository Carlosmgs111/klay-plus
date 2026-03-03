import type { ContextRepository } from "../context/domain/ContextRepository";
import type { EventPublisher } from "../../../shared/domain/EventPublisher";
import { Context } from "../context/domain/Context";
import { ContextId } from "../context/domain/ContextId";
import { ContextSource } from "../context/domain/ContextSource";
import { ContextMetadata } from "../context/domain/ContextMetadata";
import { Result } from "../../../shared/domain/Result";
import {
  NotFoundError,
  DomainError,
} from "../../../shared/domain/errors";

// ── Domain errors ──────────────────────────────────────────────────

export class ContextNotFoundError extends NotFoundError {
  constructor(contextId: string) {
    super("Context", contextId);
  }
}

export class ProfileNotSatisfiedError extends DomainError {
  constructor(contextId: string, sourceId: string) {
    super(
      "Source does not satisfy context's required profile",
      "PROFILE_NOT_SATISFIED",
      { contextId, sourceId },
    );
  }
}

// ── Module dependencies ────────────────────────────────────────────

export interface ResolvedContextManagementModules {
  contextRepository: ContextRepository;
  contextEventPublisher: EventPublisher;
}

// ── Service ────────────────────────────────────────────────────────

export class ContextManagementService {
  private readonly _repository: ContextRepository;
  private readonly _eventPublisher: EventPublisher;

  constructor(modules: ResolvedContextManagementModules) {
    this._repository = modules.contextRepository;
    this._eventPublisher = modules.contextEventPublisher;
  }

  /**
   * Creates a new Context aggregate.
   */
  async createContext(params: {
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

    await this._repository.save(context);
    await this._eventPublisher.publishAll(context.clearEvents());

    return Result.ok(context);
  }

  /**
   * Adds a source to a context.
   * The caller (orchestrator) is responsible for verifying profile satisfaction
   * and passing profileSatisfied=true. This preserves bounded context isolation.
   */
  async addSourceToContext(params: {
    contextId: string;
    sourceId: string;
    sourceKnowledgeId: string;
    profileSatisfied: boolean;
  }): Promise<Result<DomainError, Context>> {
    const context = await this._repository.findById(
      ContextId.create(params.contextId),
    );
    if (!context) {
      return Result.fail(new ContextNotFoundError(params.contextId));
    }

    if (!params.profileSatisfied) {
      return Result.fail(
        new ProfileNotSatisfiedError(params.contextId, params.sourceId),
      );
    }

    const source = ContextSource.create(
      params.sourceId,
      params.sourceKnowledgeId,
    );
    context.addSource(source);

    await this._repository.save(context);
    await this._eventPublisher.publishAll(context.clearEvents());

    return Result.ok(context);
  }

  /**
   * Removes a source from a context.
   */
  async removeSourceFromContext(params: {
    contextId: string;
    sourceId: string;
  }): Promise<Result<DomainError, Context>> {
    const context = await this._repository.findById(
      ContextId.create(params.contextId),
    );
    if (!context) {
      return Result.fail(new ContextNotFoundError(params.contextId));
    }

    context.removeSource(params.sourceId);

    await this._repository.save(context);
    await this._eventPublisher.publishAll(context.clearEvents());

    return Result.ok(context);
  }

  /**
   * Rolls back a context to a previous version.
   */
  async rollbackContext(params: {
    contextId: string;
    targetVersion: number;
  }): Promise<Result<DomainError, Context>> {
    const context = await this._repository.findById(
      ContextId.create(params.contextId),
    );
    if (!context) {
      return Result.fail(new ContextNotFoundError(params.contextId));
    }

    context.rollbackToVersion(params.targetVersion);

    await this._repository.save(context);
    await this._eventPublisher.publishAll(context.clearEvents());

    return Result.ok(context);
  }

  /**
   * Deprecates a context with a reason.
   */
  async deprecateContext(params: {
    contextId: string;
    reason: string;
  }): Promise<Result<DomainError, Context>> {
    const context = await this._repository.findById(
      ContextId.create(params.contextId),
    );
    if (!context) {
      return Result.fail(new ContextNotFoundError(params.contextId));
    }

    context.deprecate(params.reason);

    await this._repository.save(context);
    await this._eventPublisher.publishAll(context.clearEvents());

    return Result.ok(context);
  }

  /**
   * Activates a context (Draft -> Active, or Deprecated -> Active).
   */
  async activateContext(params: {
    contextId: string;
  }): Promise<Result<DomainError, Context>> {
    const context = await this._repository.findById(
      ContextId.create(params.contextId),
    );
    if (!context) {
      return Result.fail(new ContextNotFoundError(params.contextId));
    }

    context.activate();

    await this._repository.save(context);
    await this._eventPublisher.publishAll(context.clearEvents());

    return Result.ok(context);
  }

  /**
   * Archives a context (Active -> Archived, or Deprecated -> Archived).
   */
  async archiveContext(params: {
    contextId: string;
  }): Promise<Result<DomainError, Context>> {
    const context = await this._repository.findById(
      ContextId.create(params.contextId),
    );
    if (!context) {
      return Result.fail(new ContextNotFoundError(params.contextId));
    }

    context.archive();

    await this._repository.save(context);
    await this._eventPublisher.publishAll(context.clearEvents());

    return Result.ok(context);
  }
}
