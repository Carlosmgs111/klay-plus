import type { SemanticProcessingFacade } from "../../../../contexts/semantic-processing/facade/SemanticProcessingFacade.js";
import type { ProjectionType } from "../../../../contexts/semantic-processing/projection/domain/ProjectionType.js";
import type { ProcessDocumentInput, ProcessDocumentSuccess } from "../../contracts/dtos.js";
import { Result } from "../../../../shared/domain/Result.js";
import { KnowledgePipelineError } from "../../domain/KnowledgePipelineError.js";
import { PipelineStep } from "../../domain/PipelineStep.js";

// Default projection type when not specified
const DEFAULT_PROJECTION_TYPE = "EMBEDDING";

/**
 * Use Case: Process Document
 *
 * Processes content into semantic projections (chunking + embeddings)
 * via the SemanticProcessingFacade.
 */
export class ProcessDocument {
  constructor(
    private readonly _processing: SemanticProcessingFacade,
  ) {}

  async execute(
    input: ProcessDocumentInput,
    completedSteps: PipelineStep[] = [],
  ): Promise<Result<KnowledgePipelineError, ProcessDocumentSuccess>> {
    const result = await this._processing.processContent({
      projectionId: input.projectionId,
      semanticUnitId: input.semanticUnitId,
      semanticUnitVersion: input.semanticUnitVersion,
      content: input.content,
      type: (input.projectionType ?? DEFAULT_PROJECTION_TYPE) as ProjectionType,
      processingProfileId: input.processingProfileId,
    });

    if (result.isFail()) {
      return Result.fail(
        KnowledgePipelineError.fromStep(
          PipelineStep.Processing,
          result.error,
          completedSteps,
        ),
      );
    }

    return Result.ok({
      projectionId: result.value.projectionId,
      chunksCount: result.value.chunksCount,
      dimensions: result.value.dimensions,
      model: result.value.model,
    });
  }
}
