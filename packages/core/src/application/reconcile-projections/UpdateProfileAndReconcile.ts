import type { UpdateContextProfile } from "../../contexts/context-management/context/application/use-cases/UpdateContextProfile";
import type { ProjectionOperationsPort } from "../../contexts/semantic-processing/projection/application/ports/ProjectionOperationsPort";
import type { Context } from "../../contexts/context-management/context/domain/Context";
import type { DomainError } from "../../shared/domain/errors";
import { Result } from "../../shared/domain/Result";

export interface UpdateAndReconcileResult {
  context: Context;
  reconciled?: { processedCount: number; failedCount: number };
}

/**
 * UpdateProfileAndReconcile — Application-layer composite orchestrator.
 *
 * Pipeline: UpdateContextProfile (domain) → ReconcileProjections (best-effort).
 *
 * Semantics: best-effort.
 * - Profile update is committed even if reconciliation fails.
 * - Reconciliation failures are reported in the result, not propagated.
 */
export interface UpdateProfileAndReconcileDeps {
  updateContextProfile: UpdateContextProfile;
  projectionOperations: ProjectionOperationsPort;
  getExtractedText: (sourceId: string) => Promise<Result<DomainError, { text: string }>>;
}

export class UpdateProfileAndReconcile {
  constructor(private readonly _deps: UpdateProfileAndReconcileDeps) {}

  async execute(params: {
    contextId: string;
    profileId: string;
  }): Promise<Result<DomainError, UpdateAndReconcileResult>> {
    const updateResult = await this._deps.updateContextProfile.execute(params);
    if (updateResult.isFail()) {
      return updateResult as Result<DomainError, never>;
    }

    const context = updateResult.value;

    let reconciled: { processedCount: number; failedCount: number } | undefined;
    if (context.activeSources.length > 0) {
      reconciled = await this._reconcileSources(context, params.profileId);
    }

    return Result.ok({ context, reconciled });
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
