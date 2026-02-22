import type { KnowledgeRetrievalFacade } from "../../../../contexts/knowledge-retrieval/facade/KnowledgeRetrievalFacade.js";
import type { SearchKnowledgeInput, SearchKnowledgeSuccess } from "../../contracts/dtos.js";
import { Result } from "../../../../shared/domain/Result.js";
import { KnowledgePipelineError } from "../../domain/KnowledgePipelineError.js";
import { PipelineStep } from "../../domain/PipelineStep.js";

/**
 * Use Case: Search Knowledge
 *
 * Performs semantic search over the knowledge base via the KnowledgeRetrievalFacade.
 * Independent from the pipeline construction flow (Ingest → Process → Catalog).
 */
export class SearchKnowledge {
  constructor(
    private readonly _retrieval: KnowledgeRetrievalFacade,
  ) {}

  async execute(
    input: SearchKnowledgeInput,
  ): Promise<Result<KnowledgePipelineError, SearchKnowledgeSuccess>> {
    try {
      const result = await this._retrieval.query({
        text: input.queryText,
        topK: input.topK,
        minScore: input.minScore,
        filters: input.filters,
      });

      return Result.ok({
        queryText: result.queryText,
        items: result.items.map((item) => ({
          semanticUnitId: item.semanticUnitId,
          content: item.content,
          score: item.score,
          version: item.version,
          metadata: item.metadata as Record<string, unknown>,
        })),
        totalFound: result.totalFound,
      });
    } catch (error) {
      return Result.fail(
        KnowledgePipelineError.fromStep(PipelineStep.Search, error, []),
      );
    }
  }
}
