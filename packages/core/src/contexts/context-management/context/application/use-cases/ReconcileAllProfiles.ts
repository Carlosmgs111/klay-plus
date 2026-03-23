import type { ActiveProfilesPort } from "../ports/ActiveProfilesPort";
import type { ReconcileProjections } from "./ReconcileProjections";
import type { ReconcileAllProfilesInput, ReconcileAllProfilesResult } from "../../../../../application/knowledge/dtos";
import { Result } from "../../../../../shared/domain/Result";
import { KnowledgeError } from "../../../../../application/knowledge/domain/KnowledgeError";
import { OperationStep } from "../../../../../application/knowledge/domain/OperationStep";

/**
 * ReconcileAllProfiles — Use case owned by context-management bounded context.
 *
 * Runs ReconcileProjections for every active processing profile, ensuring
 * all sources in a context have projections for all active profiles.
 * Uses ActiveProfilesPort to list profiles without directly depending on
 * SemanticProcessingService.
 */
export class ReconcileAllProfiles {
  constructor(
    private readonly _reconcileProjections: ReconcileProjections,
    private readonly _activeProfiles: ActiveProfilesPort,
  ) {}

  async execute(
    input: ReconcileAllProfilesInput,
  ): Promise<Result<KnowledgeError, ReconcileAllProfilesResult>> {
    try {
      const activeProfiles = await this._activeProfiles.listActiveProfiles();

      const profileResults: Array<{ profileId: string; processedCount: number; failedCount: number }> = [];

      for (const profile of activeProfiles) {
        const profileId = profile.id;
        const result = await this._reconcileProjections.execute({ contextId: input.contextId, profileId });
        if (result.isOk()) {
          profileResults.push({ profileId, processedCount: result.value.processedCount, failedCount: result.value.failedCount });
        } else {
          profileResults.push({ profileId, processedCount: 0, failedCount: 1 });
        }
      }

      return Result.ok({
        contextId: input.contextId,
        profileResults,
        totalProcessed: profileResults.reduce((sum, r) => sum + r.processedCount, 0),
        totalFailed: profileResults.reduce((sum, r) => sum + r.failedCount, 0),
      });
    } catch (error) {
      return Result.fail(KnowledgeError.fromStep(OperationStep.Processing, error, []));
    }
  }
}
