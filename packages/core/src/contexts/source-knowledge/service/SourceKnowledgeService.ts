import type { SourceKnowledgeRepository } from "../source/domain/SourceKnowledgeRepository";
import type { EventPublisher } from "../../../shared/domain/EventPublisher";
import { SourceKnowledge } from "../source/domain/SourceKnowledge";
import { SourceKnowledgeId } from "../source/domain/SourceKnowledgeId";
import { Result } from "../../../shared/domain/Result";
import {
  NotFoundError,
  AlreadyExistsError,
  type DomainError,
} from "../../../shared/domain/errors";

// ── Domain errors ──────────────────────────────────────────────────

export class SourceKnowledgeNotFoundError extends NotFoundError {
  constructor(sourceId: string) {
    super("SourceKnowledge", sourceId);
  }
}

export class SourceKnowledgeAlreadyExistsError extends AlreadyExistsError {
  constructor(sourceId: string) {
    super("SourceKnowledge", sourceId);
  }
}

// ── Module dependencies ────────────────────────────────────────────

export interface ResolvedSourceKnowledgeModules {
  sourceKnowledgeRepository: SourceKnowledgeRepository;
  sourceKnowledgeEventPublisher: EventPublisher;
}

// ── Result types ───────────────────────────────────────────────────

export interface SatisfiesProfileResult {
  satisfied: boolean;
}

export interface EnsureProfileSatisfiedResult {
  satisfied: boolean;
  sourceKnowledgeId?: string;
}

// ── Service ────────────────────────────────────────────────────────

export class SourceKnowledgeService {
  private readonly _repository: SourceKnowledgeRepository;
  private readonly _eventPublisher: EventPublisher;

  constructor(modules: ResolvedSourceKnowledgeModules) {
    this._repository = modules.sourceKnowledgeRepository;
    this._eventPublisher = modules.sourceKnowledgeEventPublisher;
  }

  /**
   * Creates a new SourceKnowledge aggregate for a source.
   * Returns error if a SourceKnowledge already exists for the given sourceId.
   */
  async createSourceKnowledge(params: {
    id: string;
    sourceId: string;
    contentHash: string;
    defaultProfileId: string;
  }): Promise<Result<DomainError, SourceKnowledge>> {
    // Check for duplicate sourceId
    const existing = await this._repository.findBySourceId(params.sourceId);
    if (existing) {
      return Result.fail(
        new SourceKnowledgeAlreadyExistsError(params.sourceId),
      );
    }

    const sk = SourceKnowledge.create({
      id: SourceKnowledgeId.create(params.id),
      sourceId: params.sourceId,
      contentHash: params.contentHash,
      defaultProfileId: params.defaultProfileId,
    });

    await this._repository.save(sk);
    await this._eventPublisher.publishAll(sk.clearEvents());

    return Result.ok(sk);
  }

  /**
   * Registers (or updates) a projection for a source's knowledge hub.
   * Returns NotFoundError if the sourceId has no SourceKnowledge.
   */
  async registerProjection(params: {
    sourceId: string;
    projectionId: string;
    profileId: string;
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  }): Promise<Result<DomainError, SourceKnowledge>> {
    const sk = await this._repository.findBySourceId(params.sourceId);
    if (!sk) {
      return Result.fail(new SourceKnowledgeNotFoundError(params.sourceId));
    }

    sk.registerProjection({
      projectionId: params.projectionId,
      profileId: params.profileId,
      status: params.status,
    });

    await this._repository.save(sk);
    await this._eventPublisher.publishAll(sk.clearEvents());

    return Result.ok(sk);
  }

  /**
   * Checks whether a source's knowledge hub has a COMPLETED projection
   * for the given profile.
   */
  async satisfiesProfile(params: {
    sourceId: string;
    profileId: string;
  }): Promise<Result<DomainError, SatisfiesProfileResult>> {
    const sk = await this._repository.findBySourceId(params.sourceId);
    if (!sk) {
      return Result.fail(new SourceKnowledgeNotFoundError(params.sourceId));
    }

    return Result.ok({ satisfied: sk.satisfiesProfile(params.profileId) });
  }

  /**
   * Retrieves a SourceKnowledge by its associated sourceId.
   */
  async getBySourceId(params: {
    sourceId: string;
  }): Promise<Result<DomainError, SourceKnowledge>> {
    const sk = await this._repository.findBySourceId(params.sourceId);
    if (!sk) {
      return Result.fail(new SourceKnowledgeNotFoundError(params.sourceId));
    }

    return Result.ok(sk);
  }

  /**
   * Checks if source has a completed projection for the given profile.
   * Returns { satisfied: true } if yes.
   * Returns { satisfied: false, sourceKnowledgeId } if no (caller knows processing is needed).
   */
  async ensureProfileSatisfied(params: {
    sourceId: string;
    profileId: string;
  }): Promise<Result<DomainError, EnsureProfileSatisfiedResult>> {
    const sk = await this._repository.findBySourceId(params.sourceId);
    if (!sk) {
      return Result.fail(new SourceKnowledgeNotFoundError(params.sourceId));
    }

    if (sk.satisfiesProfile(params.profileId)) {
      return Result.ok({ satisfied: true });
    }

    return Result.ok({
      satisfied: false,
      sourceKnowledgeId: sk.id.value,
    });
  }
}
