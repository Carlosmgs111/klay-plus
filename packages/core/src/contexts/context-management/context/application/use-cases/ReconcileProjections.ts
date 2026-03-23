import type { ContextRepository } from "../../domain/ContextRepository";
import type { ProjectionOperationsPort } from "../ports/ProjectionOperationsPort";
import type { SourceTextPort } from "../ports/SourceTextPort";
import type { ActiveProfilesPort } from "../ports/ActiveProfilesPort";
import type {
  ReconcileProjectionsInput,
  ReconcileProjectionsResult,
  ReconcileAllProfilesInput,
  ReconcileAllProfilesResult,
} from "../../../../../application/knowledge/dtos";
import { Result } from "../../../../../shared/domain/Result";
import { KnowledgeError } from "../../../../../application/knowledge/domain/KnowledgeError";
import { OperationStep } from "../../../../../application/knowledge/domain/OperationStep";
import { ContextId } from "../../domain/ContextId";

/**
 * ReconcileProjections — Use case owned by context-management bounded context.
 *
 * Ensures all active sources in a context have projections for a given profile.
 * Uses SourceTextPort to access extracted text without directly depending on
 * SourceIngestionService.
 * Uses ProjectionOperationsPort to interact with semantic-processing without
 * directly depending on SemanticProcessingService.
 */
export class ReconcileProjections {
  constructor(
    private readonly _contextRepository: ContextRepository,
    private readonly _projectionOperations: ProjectionOperationsPort,
    private readonly _sourceText: SourceTextPort,
    private readonly _activeProfiles?: ActiveProfilesPort
  ) {}

  async execute(
    input: ReconcileProjectionsInput
  ): Promise<Result<KnowledgeError, ReconcileProjectionsResult>> {
    try {
      const context = await this._contextRepository.findById(
        ContextId.create(input.contextId)
      );

      if (!context) {
        return Result.fail(
          KnowledgeError.fromStep(
            OperationStep.ReconcileProjections,
            {
              message: `Context ${input.contextId} not found`,
              code: "CONTEXT_NOT_FOUND",
            },
            []
          )
        );
      }

      const sources = context.activeSources;
      let processedCount = 0;
      let failedCount = 0;

      for (const source of sources) {
        try {
          const existing =
            await this._projectionOperations.findExistingProjection(
              source.sourceId,
              input.profileId
            );
          if (existing) {
            processedCount++;
            continue;
          }

          const reconciled = await this._reconcileSourceForProfile({
            sourceId: source.sourceId,
            profileId: input.profileId,
            contextId: input.contextId,
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
      return Result.fail(
        KnowledgeError.fromStep(OperationStep.ReconcileProjections, error, [])
      );
    }
  }

  /** From ReconcileAllProfiles — loops through all active profiles calling execute() for each. */
  async executeAllProfiles(
    input: ReconcileAllProfilesInput
  ): Promise<Result<KnowledgeError, ReconcileAllProfilesResult>> {
    try {
      if (!this._activeProfiles) {
        return Result.fail(
          KnowledgeError.fromStep(
            OperationStep.Processing,
            {
              message: "ActiveProfilesPort not provided",
              code: "INTERNAL_ERROR",
            },
            []
          )
        );
      }

      const activeProfiles = await this._activeProfiles.listActiveProfiles();

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
          profileResults.push({ profileId, processedCount: 0, failedCount: 1 });
        }
      }

      return Result.ok({
        contextId: input.contextId,
        profileResults,
        totalProcessed: profileResults.reduce(
          (sum, r) => sum + r.processedCount,
          0
        ),
        totalFailed: profileResults.reduce((sum, r) => sum + r.failedCount, 0),
      });
    } catch (error) {
      return Result.fail(
        KnowledgeError.fromStep(OperationStep.Processing, error, [])
      );
    }
  }

  private async _reconcileSourceForProfile(params: {
    sourceId: string;
    profileId: string;
    contextId: string;
  }): Promise<{ success: boolean; projectionId?: string }> {
    const textResult = await this._sourceText.getExtractedText(params.sourceId);
    if (textResult.isFail()) return { success: false };

    await this._projectionOperations.cleanupSourceProjectionForProfile(
      params.sourceId,
      params.profileId
    );

    const projectionId = crypto.randomUUID();
    const result = await this._projectionOperations.processContent({
      projectionId,
      sourceId: params.sourceId,
      content: textResult.value.text,
      type: "EMBEDDING" as any,
      processingProfileId: params.profileId,
    });

    if (result.isFail()) return { success: false };

    return { success: true, projectionId };
  }
}
