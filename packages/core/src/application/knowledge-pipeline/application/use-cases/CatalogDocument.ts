import type { SemanticKnowledgeFacade } from "../../../../contexts/semantic-knowledge/facade/SemanticKnowledgeFacade.js";
import type { CatalogDocumentInput, CatalogDocumentSuccess } from "../../contracts/dtos.js";
import { Result } from "../../../../shared/domain/Result.js";
import { KnowledgePipelineError } from "../../domain/KnowledgePipelineError.js";
import { PipelineStep } from "../../domain/PipelineStep.js";

/**
 * Use Case: Catalog Document
 *
 * Creates a semantic unit with lineage tracking via the SemanticKnowledgeFacade.
 */
export class CatalogDocument {
  constructor(
    private readonly _knowledge: SemanticKnowledgeFacade,
  ) {}

  async execute(
    input: CatalogDocumentInput,
    completedSteps: PipelineStep[] = [],
  ): Promise<Result<KnowledgePipelineError, CatalogDocumentSuccess>> {
    const result = await this._knowledge.createSemanticUnit({
      id: input.semanticUnitId,
      name: input.name,
      description: input.description,
      language: input.language,
      createdBy: input.createdBy,
      tags: input.tags,
      attributes: input.attributes,
    });

    if (result.isFail()) {
      return Result.fail(
        KnowledgePipelineError.fromStep(
          PipelineStep.Cataloging,
          result.error,
          completedSteps,
        ),
      );
    }

    return Result.ok({
      unitId: result.value.unitId,
    });
  }
}
