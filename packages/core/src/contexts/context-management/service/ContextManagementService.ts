import type { ContextRepository } from "../context/domain/ContextRepository";
import type { KnowledgeLineageRepository } from "../lineage/domain/KnowledgeLineageRepository";
import type { EventPublisher } from "../../../shared/domain/EventPublisher";
import { Context } from "../context/domain/Context";
import { ContextId } from "../context/domain/ContextId";
import { ContextSource } from "../context/domain/ContextSource";
import { ContextMetadata } from "../context/domain/ContextMetadata";
import { KnowledgeLineage } from "../lineage/domain/KnowledgeLineage";
import { LineageId } from "../lineage/domain/LineageId";
import { Trace } from "../lineage/domain/Trace";
import { Result } from "../../../shared/domain/Result";
import {
  NotFoundError,
  DomainError,
  OperationError,
} from "../../../shared/domain/errors";

// ── Domain errors ──────────────────────────────────────────────────

export class ContextNotFoundError extends NotFoundError {
  constructor(contextId: string) {
    super("Context", contextId);
  }
}


export class LineageOperationError extends OperationError {
  constructor(operation: string, reason: string) {
    super(operation, reason);
  }
}

// ── Module dependencies ────────────────────────────────────────────

export interface ResolvedContextManagementModules {
  contextRepository: ContextRepository;
  contextEventPublisher: EventPublisher;
  lineageRepository?: KnowledgeLineageRepository;
  lineageEventPublisher?: EventPublisher;
}

// ── Service ────────────────────────────────────────────────────────

export class ContextManagementService {
  private readonly _repository: ContextRepository;
  private readonly _eventPublisher: EventPublisher;
  private readonly _lineageRepository: KnowledgeLineageRepository | null;
  private readonly _lineageEventPublisher: EventPublisher | null;

  constructor(modules: ResolvedContextManagementModules) {
    this._repository = modules.contextRepository;
    this._eventPublisher = modules.contextEventPublisher;
    this._lineageRepository = modules.lineageRepository ?? null;
    this._lineageEventPublisher = modules.lineageEventPublisher ?? null;
  }

  private ensureLineage(): { repository: KnowledgeLineageRepository; eventPublisher: EventPublisher } {
    if (!this._lineageRepository || !this._lineageEventPublisher) {
      throw new Error(
        "Lineage operations require lineageRepository and lineageEventPublisher in modules",
      );
    }
    return {
      repository: this._lineageRepository,
      eventPublisher: this._lineageEventPublisher,
    };
  }

  /**
   * Gets a Context by ID. Returns null if not found.
   */
  async getContext(contextId: string): Promise<Context | null> {
    return this._repository.findById(ContextId.create(contextId));
  }

  /**
   * Gets lineage traces for a given context.
   * Returns empty traces array if no lineage exists (not an error).
   */
  async getLineage(contextId: string): Promise<Result<DomainError, { contextId: string; traces: Array<{ fromContextId: string; toContextId: string; relationship: string; createdAt: Date }> }>> {
    const { repository } = this.ensureLineage();
    const lineage = await repository.findByContextId(contextId);
    if (!lineage) {
      return Result.ok({ contextId, traces: [] });
    }
    return Result.ok({
      contextId,
      traces: lineage.traces.map(t => ({
        fromContextId: t.fromContextId,
        toContextId: t.toContextId,
        relationship: t.relationship,
        createdAt: t.createdAt,
      })),
    });
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
   * The caller (orchestrator) ensures processing has completed before calling this.
   */
  async addSourceToContext(params: {
    contextId: string;
    sourceId: string;
    sourceKnowledgeId?: string;
  }): Promise<Result<DomainError, Context>> {
    const context = await this._repository.findById(
      ContextId.create(params.contextId),
    );
    if (!context) {
      return Result.fail(new ContextNotFoundError(params.contextId));
    }

    const sourceKnowledgeId = params.sourceKnowledgeId ?? `sk-${params.sourceId}`;
    const source = ContextSource.create(
      params.sourceId,
      sourceKnowledgeId,
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

  /**
   * Links two contexts via a named relationship (stored in lineage).
   */
  async linkContexts(params: {
    fromContextId: string;
    toContextId: string;
    relationship: string;
  }): Promise<Result<DomainError, { fromContextId: string; toContextId: string }>> {
    const { repository, eventPublisher } = this.ensureLineage();

    try {
      if (params.fromContextId === params.toContextId) {
        return Result.fail(
          new LineageOperationError("linkContexts", "Cannot link a context to itself"),
        );
      }

      let lineage = await repository.findByContextId(params.fromContextId);

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

      await repository.save(lineage);
      await eventPublisher.publishAll(lineage.clearEvents());

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

  /**
   * Unlinks two contexts (removes a trace from lineage).
   */
  async unlinkContexts(params: {
    fromContextId: string;
    toContextId: string;
  }): Promise<Result<DomainError, { fromContextId: string; toContextId: string }>> {
    const { repository, eventPublisher } = this.ensureLineage();

    try {
      const lineage = await repository.findByContextId(params.fromContextId);

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

      await repository.save(lineage);
      await eventPublisher.publishAll(lineage.clearEvents());

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
