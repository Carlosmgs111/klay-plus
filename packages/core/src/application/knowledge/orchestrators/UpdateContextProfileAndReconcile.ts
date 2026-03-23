import { Result } from "../../../shared/domain/Result";
import { KnowledgeError } from "../domain/KnowledgeError";
import { OperationStep } from "../domain/OperationStep";
import type { UpdateContextProfile } from "../../../contexts/context-management/context/application/use-cases/UpdateContextProfile";
import type { ReconcileProjections } from "../../../contexts/context-management/context/application/use-cases/ReconcileProjections";
import type { UpdateContextProfileInput, UpdateContextProfileResult } from "../dtos";

/**
 * UpdateContextProfileAndReconcile — orchestrates profile update + auto-reconciliation.
 *
 * Updates the required processing profile on a Context, then automatically
 * reconciles projections if the context has active sources (ensures all
 * sources get projections for the new profile).
 */
export class UpdateContextProfileAndReconcile {
  constructor(
    private readonly updateContextProfile: UpdateContextProfile,
    private readonly reconcileProjections: ReconcileProjections,
  ) {}

  async execute(input: UpdateContextProfileInput): Promise<Result<KnowledgeError, UpdateContextProfileResult>> {
    try {
      const result = await this.updateContextProfile.execute({
        contextId: input.contextId,
        profileId: input.profileId,
      });

      if (result.isFail()) {
        return Result.fail(
          KnowledgeError.fromStep(OperationStep.UpdateContextProfile, result.error, []),
        );
      }

      const updatedContext = result.value;
      let reconciled: { processedCount: number; failedCount: number } | undefined;

      // Auto-reconcile projections if context has active sources
      if (updatedContext.activeSources.length > 0) {
        const reconcileResult = await this.reconcileProjections.execute({
          contextId: input.contextId,
          profileId: input.profileId,
        });

        if (reconcileResult.isOk()) {
          reconciled = {
            processedCount: reconcileResult.value.processedCount,
            failedCount: reconcileResult.value.failedCount,
          };
        }
      }

      return Result.ok({
        contextId: updatedContext.id.value,
        profileId: updatedContext.requiredProfileId,
        reconciled,
      });
    } catch (error) {
      return Result.fail(
        KnowledgeError.fromStep(OperationStep.UpdateContextProfile, error, []),
      );
    }
  }
}
