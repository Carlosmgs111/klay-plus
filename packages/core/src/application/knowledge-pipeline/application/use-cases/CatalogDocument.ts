import type { SemanticKnowledgeFacade } from "../../../../contexts/semantic-knowledge/facade/SemanticKnowledgeFacade";
import type { CatalogDocumentInput, CatalogDocumentSuccess } from "../../contracts/dtos.js";
import { Result } from "../../../../shared/domain/Result";
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
    const result = await this._knowledge.createSemanticUnitWithLineage({
      id: input.id,
      sourceId: input.sourceId,
      sourceType: input.sourceType,
      content: input.content,
      language: input.language,
      createdBy: input.createdBy,
      topics: input.topics,
      tags: input.tags,
      summary: input.summary,
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
