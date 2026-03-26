import type { ContextRepository } from "../../domain/ContextRepository";
import type { EventPublisher } from "../../../../../shared/domain/EventPublisher";
import type { ProjectionOperationsPort } from "../../../../semantic-processing/projection/application/ports/ProjectionOperationsPort";
import type { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";
import type { Context } from "../../domain/Context";
import { Result as R } from "../../../../../shared/domain/Result";
import { ContextId } from "../../domain/ContextId";
import { NotFoundError } from "../../../../../shared/domain/errors";

// ── Boundary DTOs ────────────────────────────────────────────────────

export interface UpdateContextProfileInput {
  contextId: string;
  profileId: string;
}

export interface UpdateContextProfileResult {
  contextId: string;
  profileId: string;
  reconciled?: { processedCount: number; failedCount: number };
}

export interface UpdateAndReconcileResult {
  context: Context;
  reconciled?: { processedCount: number; failedCount: number };
}

/**
 * UpdateProfileAndReconcile — context-management use case.
 *
 * Pipeline: update profile on context (domain) → reconcile projections (best-effort).
 *
 * Semantics: best-effort.
 * - Profile update is committed even if reconciliation fails.
 * - Reconciliation failures are reported in the result, not propagated.
 */
export interface UpdateProfileAndReconcileDeps {
  projectionOperations: ProjectionOperationsPort;
  getExtractedText: (sourceId: string) => Promise<Result<DomainError, { text: string }>>;
}

export class UpdateProfileAndReconcile {
  constructor(
    private readonly _repo: ContextRepository,
    private readonly _eventPublisher: EventPublisher,
    private readonly _deps: UpdateProfileAndReconcileDeps,
  ) {}

  async execute(params: {
    contextId: string;
    profileId: string;
  }): Promise<R<DomainError, UpdateAndReconcileResult>> {
    // Step 1: Domain operation — update profile
    const context = await this._repo.findById(ContextId.create(params.contextId));
    if (!context) {
      return R.fail(new NotFoundError("Context", params.contextId));
    }

    context.changeRequiredProfile(params.profileId);
    await this._repo.save(context);
    await this._eventPublisher.publishAll(context.clearEvents());

    // Step 2: Best-effort reconciliation
    let reconciled: { processedCount: number; failedCount: number } | undefined;
    if (context.activeSources.length > 0) {
      reconciled = await this._reconcileSources(context, params.profileId);
    }

    return R.ok({ context, reconciled });
  }

  private async _reconcileSources(
    context: Context,
    profileId: string,
  ): Promise<{ processedCount: number; failedCount: number }> {
    let processedCount = 0;
    let failedCount = 0;

    for (const source of context.activeSources) {
      try {
        const existing =
          await this._deps.projectionOperations.findExistingProjection(
            source.sourceId,
            profileId,
          );
        if (existing) {
          processedCount++;
          continue;
        }

        const textResult = await this._deps.getExtractedText(source.sourceId);
        if (textResult.isFail()) {
          failedCount++;
          continue;
        }

        await this._deps.projectionOperations.cleanupSourceProjectionForProfile(
          source.sourceId,
          profileId,
        );

        const result = await this._deps.projectionOperations.processContent({
          projectionId: crypto.randomUUID(),
          sourceId: source.sourceId,
          content: textResult.value.text,
          type: "EMBEDDING" as any,
          processingProfileId: profileId,
        });

        if (result.isOk()) processedCount++;
        else failedCount++;
      } catch {
        failedCount++;
      }
    }

    return { processedCount, failedCount };
  }
}
