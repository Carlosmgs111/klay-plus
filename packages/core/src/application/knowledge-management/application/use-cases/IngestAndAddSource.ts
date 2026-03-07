import type { SourceIngestionService } from "../../../../contexts/source-ingestion/service/SourceIngestionService";
import type { SourceKnowledgeService } from "../../../../contexts/source-knowledge/service/SourceKnowledgeService";
import type { SemanticProcessingService } from "../../../../contexts/semantic-processing/service/SemanticProcessingService";
import type { ContextManagementService } from "../../../../contexts/context-management/service/ContextManagementService";
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
 * existing context:
 *
 * 1. Ingest source via ingestion service
 * 2. Create SourceKnowledge (projection hub) for the source
 * 3. Process content via processing service (sourceId-primary)
 * 4. Register projection in source-knowledge hub
 * 5. Add source to context
 *
 * Each step tracks completed steps for error reporting.
 * If a step fails, the error includes which steps completed successfully.
 */
export class IngestAndAddSource {
  constructor(
    private readonly _ingestion: SourceIngestionService,
    private readonly _sourceKnowledge: SourceKnowledgeService,
    private readonly _processing: SemanticProcessingService,
    private readonly _contextManagement: ContextManagementService,
  ) {}

  async execute(
    input: IngestAndAddSourceInput,
  ): Promise<Result<KnowledgeManagementError, IngestAndAddSourceSuccess>> {
    const completedSteps: ManagementStep[] = [];

    // ── Step 1: Ingest source ──────────────────────────────────────
    const ingestionResult = await this._ingestion.ingestAndExtract({
      sourceId: input.sourceId,
      sourceName: input.sourceName,
      uri: input.uri,
      type: input.sourceType as SourceType,
      extractionJobId: input.extractionJobId,
      content: input.content,
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

    // ── Step 2: Create SourceKnowledge (projection hub) ────────────
    const sourceKnowledgeId = `sk-${input.sourceId}`;
    const skResult = await this._sourceKnowledge.createSourceKnowledge({
      id: sourceKnowledgeId,
      sourceId: input.sourceId,
      contentHash: ingestionResult.value.contentHash,
      defaultProfileId: input.processingProfileId,
    });

    if (skResult.isFail()) {
      return Result.fail(
        KnowledgeManagementError.fromStep(
          ManagementStep.CreateSourceKnowledge,
          skResult.error,
          completedSteps,
        ),
      );
    }

    completedSteps.push(ManagementStep.CreateSourceKnowledge);

    // ── Step 3: Process content (sourceId-primary) ─────────────────
    const processingResult = await this._processing.processContent({
      projectionId: input.projectionId,
      sourceId: input.sourceId,
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

    // ── Step 4: Register projection in source-knowledge hub ────────
    const registerResult = await this._sourceKnowledge.registerProjection({
      sourceId: input.sourceId,
      projectionId: input.projectionId,
      profileId: input.processingProfileId,
      status: "COMPLETED",
    });

    if (registerResult.isFail()) {
      return Result.fail(
        KnowledgeManagementError.fromStep(
          ManagementStep.RegisterProjection,
          registerResult.error,
          completedSteps,
        ),
      );
    }

    completedSteps.push(ManagementStep.RegisterProjection);

    // ── Step 5: Ensure context exists, then add source ─────────────
    const existingContext = await this._contextManagement.getContext(input.contextId);
    if (!existingContext) {
      const createResult = await this._contextManagement.createContext({
        id: input.contextId,
        name: input.sourceName,
        description: "",
        language: "en",
        requiredProfileId: input.processingProfileId,
        createdBy: "management",
      });
      if (createResult.isFail()) {
        return Result.fail(
          KnowledgeManagementError.fromStep(
            ManagementStep.AddToContext,
            createResult.error,
            completedSteps,
          ),
        );
      }
    }

    const addToContextResult = await this._contextManagement.addSourceToContext({
      contextId: input.contextId,
      sourceId: input.sourceId,
      sourceKnowledgeId,
      profileSatisfied: true, // Just processed — profile is satisfied
    });

    if (addToContextResult.isFail()) {
      return Result.fail(
        KnowledgeManagementError.fromStep(
          ManagementStep.AddToContext,
          addToContextResult.error,
          completedSteps,
        ),
      );
    }

    completedSteps.push(ManagementStep.AddToContext);

    return Result.ok({
      sourceId: input.sourceId,
      sourceKnowledgeId,
      contextId: input.contextId,
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
