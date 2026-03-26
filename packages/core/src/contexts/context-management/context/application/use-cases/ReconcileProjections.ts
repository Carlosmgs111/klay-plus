import type { ContextRepository } from "../../domain/ContextRepository";
import type { ProjectionOperationsPort } from "../../../../semantic-processing/projection/application/ports/ProjectionOperationsPort";
import type { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";
import type {
  ReconcileProjectionsInput,
  ReconcileProjectionsResult,
  ReconcileAllProfilesInput,
  ReconcileAllProfilesResult,
} from "../../../dtos";
import { Result as R } from "../../../../../shared/domain/Result";
import { type StepError, stepError } from "../../../../../shared/domain/errors/stepError";
import { ContextId } from "../../domain/ContextId";

/**
 * ReconcileProjections — context-management use case.
 *
 * Ensures all active sources in a context have projections for a given profile.
 * Uses semantic-processing capabilities via ProjectionOperationsPort.
 *
 * Semantics: best-effort — projection failures are counted, not propagated.
 */
export interface ReconcileProjectionsDeps {
  projectionOperations: ProjectionOperationsPort;
  getExtractedText: (sourceId: string) => Promise<Result<DomainError, { text: string }>>;
  listActiveProfiles: () => Promise<Array<{ id: string }>>;
}

export class ReconcileProjections {
  constructor(
    private readonly _repo: ContextRepository,
    private readonly _deps: ReconcileProjectionsDeps,
  ) {}

  async execute(
    input: ReconcileProjectionsInput,
  ): Promise<R<StepError, ReconcileProjectionsResult>> {
    try {
      const context = await this._repo.findById(ContextId.create(input.contextId));

      if (!context) {
        return R.fail(
          stepError("reconcile-projections", {
            message: `Context ${input.contextId} not found`,
            code: "CONTEXT_NOT_FOUND",
          }),
        );
      }

      const sources = context.activeSources;
      let processedCount = 0;
      let failedCount = 0;

      for (const source of sources) {
        try {
          const existing =
            await this._deps.projectionOperations.findExistingProjection(
              source.sourceId,
              input.profileId,
            );
          if (existing) {
            processedCount++;
            continue;
          }

          const reconciled = await this._reconcileSourceForProfile({
            sourceId: source.sourceId,
            profileId: input.profileId,
          });
          if (reconciled.success) processedCount++;
          else failedCount++;
        } catch {
          failedCount++;
        }
      }

      return R.ok({
        contextId: input.contextId,
        version: context.currentVersion?.version ?? 0,
        processedCount,
        failedCount,
      });
    } catch (error) {
      return R.fail(stepError("reconcile-projections", error));
    }
  }

  async executeAllProfiles(
    input: ReconcileAllProfilesInput,
  ): Promise<R<StepError, ReconcileAllProfilesResult>> {
    try {
      const activeProfiles = await this._deps.listActiveProfiles();

      const profileResults: Array<{
        profileId: string;
        processedCount: number;
        failedCount: number;
      }> = [];

      for (const profile of activeProfiles) {
        const result = await this.execute({
          contextId: input.contextId,
          profileId: profile.id,
        });
        if (result.isOk()) {
          profileResults.push({
            profileId: profile.id,
            processedCount: result.value.processedCount,
            failedCount: result.value.failedCount,
          });
        } else {
          profileResults.push({ profileId: profile.id, processedCount: 0, failedCount: 1 });
        }
      }

      return R.ok({
        contextId: input.contextId,
        profileResults,
        totalProcessed: profileResults.reduce((sum, r) => sum + r.processedCount, 0),
        totalFailed: profileResults.reduce((sum, r) => sum + r.failedCount, 0),
      });
    } catch (error) {
      return R.fail(stepError("processing", error));
    }
  }

  private async _reconcileSourceForProfile(params: {
    sourceId: string;
    profileId: string;
  }): Promise<{ success: boolean }> {
    const textResult = await this._deps.getExtractedText(params.sourceId);
    if (textResult.isFail()) return { success: false };

    await this._deps.projectionOperations.cleanupSourceProjectionForProfile(
      params.sourceId,
      params.profileId,
    );

    const projectionId = crypto.randomUUID();
    const result = await this._deps.projectionOperations.processContent({
      projectionId,
      sourceId: params.sourceId,
      content: textResult.value.text,
      type: "EMBEDDING" as any,
      processingProfileId: params.profileId,
    });

    return { success: result.isOk() };
  }
}
