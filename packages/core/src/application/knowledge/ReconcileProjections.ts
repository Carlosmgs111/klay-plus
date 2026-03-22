import type { ContextManagementService } from "../../contexts/context-management/service/ContextManagementService";
import type { SemanticProcessingService } from "../../contexts/semantic-processing/service/SemanticProcessingService";
import type { SourceIngestionService } from "../../contexts/source-ingestion/service/SourceIngestionService";
import type { ReconcileProjectionsInput, ReconcileProjectionsResult } from "./dtos";
import { Result } from "../../shared/domain/Result";
import { KnowledgeError } from "./domain/KnowledgeError";
import { OperationStep } from "./domain/OperationStep";

export class ReconcileProjections {
  constructor(private deps: {
    contextManagement: ContextManagementService;
    processing: SemanticProcessingService;
    ingestion: SourceIngestionService;
  }) {}

  async execute(
    input: ReconcileProjectionsInput,
  ): Promise<Result<KnowledgeError, ReconcileProjectionsResult>> {
    try {
      const context = await this.deps.contextManagement.getContext(input.contextId);

      if (!context) {
        return Result.fail(
          KnowledgeError.fromStep(
            OperationStep.ReconcileProjections,
            { message: `Context ${input.contextId} not found`, code: "CONTEXT_NOT_FOUND" },
            [],
          ),
        );
      }

      const sources = context.activeSources;
      let processedCount = 0;
      let failedCount = 0;

      for (const source of sources) {
        try {
          const existing = await this.deps.processing.findExistingProjection(source.sourceId, input.profileId);
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
        KnowledgeError.fromStep(OperationStep.ReconcileProjections, error, []),
      );
    }
  }

  private async _reconcileSourceForProfile(params: {
    sourceId: string;
    profileId: string;
    contextId: string;
  }): Promise<{ success: boolean; projectionId?: string }> {
    const textResult = await this.deps.ingestion.getExtractedText(params.sourceId);
    if (textResult.isFail()) return { success: false };

    await this.deps.processing.cleanupSourceProjectionForProfile(params.sourceId, params.profileId);

    const projectionId = crypto.randomUUID();
    const result = await this.deps.processing.processContent({
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
