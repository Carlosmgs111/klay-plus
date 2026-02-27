import type { SourceIngestionService } from "../../../../contexts/source-ingestion/service/SourceIngestionService";
import type { SemanticKnowledgeService } from "../../../../contexts/semantic-knowledge/service/SemanticKnowledgeService";
import type { SemanticProcessingService } from "../../../../contexts/semantic-processing/service/SemanticProcessingService";
import type { SourceType } from "../../../../contexts/source-ingestion/source/domain/SourceType";
import type { ProjectionType } from "../../../../contexts/semantic-processing/projection/domain/ProjectionType";
import type { IngestAndAddSourceInput, IngestAndAddSourceSuccess } from "../../contracts/dtos";
import { Result } from "../../../../shared/domain/Result";
import { KnowledgeManagementError } from "../../domain/KnowledgeManagementError";
import { ManagementStep } from "../../domain/ManagementStep";

// Default projection type when not specified
const DEFAULT_PROJECTION_TYPE = "EMBEDDING";

/**
 * Use Case: Ingest and Add Source
 *
 * Coordinates the multi-step flow for adding a new source to an
 * existing semantic unit: Ingest → AddSource → Process.
 *
 * Each step tracks completed steps for error reporting.
 * If a step fails, the error includes which steps completed successfully.
 *
 * Mirrors ExecuteFullPipeline but operates on an existing unit
 * (no unit creation step).
 */
export class IngestAndAddSource {
  constructor(
    private readonly _ingestion: SourceIngestionService,
    private readonly _knowledge: SemanticKnowledgeService,
    private readonly _processing: SemanticProcessingService,
  ) {}

  async execute(
    input: IngestAndAddSourceInput,
  ): Promise<Result<KnowledgeManagementError, IngestAndAddSourceSuccess>> {
    const completedSteps: ManagementStep[] = [];

    const ingestionResult = await this._ingestion.ingestAndExtract({
      sourceId: input.sourceId,
      sourceName: input.sourceName,
      uri: input.uri,
      type: input.sourceType as SourceType,
      extractionJobId: input.extractionJobId,
    });

    if (ingestionResult.isFail()) {
      return Result.fail(
        KnowledgeManagementError.fromStep(
          ManagementStep.Ingestion,
          ingestionResult.error,
          completedSteps,
        ),
      );
    }

    completedSteps.push(ManagementStep.Ingestion);

    const addSourceResult = await this._knowledge.addSourceToSemanticUnit({
      unitId: input.unitId,
      sourceId: input.sourceId,
      sourceType: input.sourceType,
      resourceId: input.resourceId,
      extractedContent: ingestionResult.value.extractedText,
      contentHash: ingestionResult.value.contentHash,
      processingProfileId: input.processingProfileId,
      processingProfileVersion: 1,
    });

    if (addSourceResult.isFail()) {
      return Result.fail(
        KnowledgeManagementError.fromStep(
          ManagementStep.AddSource,
          addSourceResult.error,
          completedSteps,
        ),
      );
    }

    completedSteps.push(ManagementStep.AddSource);

    const processingResult = await this._processing.processContent({
      projectionId: input.projectionId,
      semanticUnitId: input.unitId,
      semanticUnitVersion: addSourceResult.value.version,
      content: ingestionResult.value.extractedText,
      type: (input.projectionType ?? DEFAULT_PROJECTION_TYPE) as ProjectionType,
      processingProfileId: input.processingProfileId,
    });

    if (processingResult.isFail()) {
      return Result.fail(
        KnowledgeManagementError.fromStep(
          ManagementStep.Processing,
          processingResult.error,
          completedSteps,
        ),
      );
    }

    completedSteps.push(ManagementStep.Processing);

    return Result.ok({
      sourceId: input.sourceId,
      unitId: input.unitId,
      version: addSourceResult.value.version,
      projectionId: processingResult.value.projectionId,
      contentHash: ingestionResult.value.contentHash,
      extractedTextLength: ingestionResult.value.extractedText.length,
      chunksCount: processingResult.value.chunksCount,
      dimensions: processingResult.value.dimensions,
      model: processingResult.value.model,
      resourceId: input.resourceId,
    });
  }
}
