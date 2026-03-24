import type { ProjectionOperationsPort } from "../ports/ProjectionOperationsPort";
import type { SourceTextPort } from "../ports/SourceTextPort";
import type { ActiveProfilesPort } from "../ports/ActiveProfilesPort";
import type { ContextQueries } from "../../contexts/context-management/context/application/use-cases/ContextQueries";
import type {
  ReconcileProjectionsInput,
  ReconcileProjectionsResult,
  ReconcileAllProfilesInput,
  ReconcileAllProfilesResult,
} from "../dtos";
import { Result } from "../../shared/domain/Result";
import { type StepError, stepError } from "../../shared/domain/errors/stepError";

/**
 * ReconcileProjections — Application-layer orchestrator.
 *
 * Ensures all active sources in a context have projections for a given profile.
 * Coordinates context-management (reads context), source-ingestion (reads text),
 * and semantic-processing (generates projections) via explicit ports.
 *
 * Semantics: best-effort — profile state is not affected by projection failures.
 */
export interface ReconcileProjectionsDeps {
  contextQueries: ContextQueries;
  projectionOperations: ProjectionOperationsPort;
  sourceText: SourceTextPort;
  activeProfiles: ActiveProfilesPort;
}

export class ReconcileProjections {
  constructor(private readonly _deps: ReconcileProjectionsDeps) {}

  async execute(
    input: ReconcileProjectionsInput,
  ): Promise<Result<StepError, ReconcileProjectionsResult>> {
    try {
      const context = await this._deps.contextQueries.getRaw(input.contextId);

      if (!context) {
        return Result.fail(
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

      return Result.ok({
        contextId: input.contextId,
        version: context.currentVersion?.version ?? 0,
        processedCount,
        failedCount,
      });
    } catch (error) {
      return Result.fail(stepError("reconcile-projections", error));
    }
  }

  async executeAllProfiles(
    input: ReconcileAllProfilesInput,
  ): Promise<Result<StepError, ReconcileAllProfilesResult>> {
    try {
      const activeProfiles =
        await this._deps.activeProfiles.listActiveProfiles();

      const profileResults: Array<{
        profileId: string;
        processedCount: number;
        failedCount: number;
      }> = [];

      for (const profile of activeProfiles) {
        const profileId = profile.id;
        const result = await this.execute({
          contextId: input.contextId,
          profileId,
        });
        if (result.isOk()) {
          profileResults.push({
            profileId,
            processedCount: result.value.processedCount,
            failedCount: result.value.failedCount,
          });
        } else {
          profileResults.push({
            profileId,
            processedCount: 0,
            failedCount: 1,
          });
        }
      }

      return Result.ok({
        contextId: input.contextId,
        profileResults,
        totalProcessed: profileResults.reduce(
          (sum, r) => sum + r.processedCount,
          0,
        ),
        totalFailed: profileResults.reduce(
          (sum, r) => sum + r.failedCount,
          0,
        ),
      });
    } catch (error) {
      return Result.fail(stepError("processing", error));
    }
  }

  private async _reconcileSourceForProfile(params: {
    sourceId: string;
    profileId: string;
  }): Promise<{ success: boolean }> {
    const textResult = await this._deps.sourceText.getExtractedText(
      params.sourceId,
    );
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
