import type { ResolvedSemanticQueryInfra } from "../../composition/factory";
import type { ContextSourcePort } from "../../domain/ports/ContextSourcePort";
import type { SearchKnowledgeInput, SearchKnowledgeSuccess } from "../../../../../application/knowledge/dtos";
import { Result } from "../../../../../shared/domain/Result";
import { KnowledgeError } from "../../../../../application/knowledge/domain/KnowledgeError";
import { OperationStep } from "../../../../../application/knowledge/domain/OperationStep";
import { ExecuteSemanticQuery } from "./ExecuteSemanticQuery";

/**
 * SearchKnowledge — Use case for semantic search across the knowledge base.
 *
 * Handles context-filtered and unfiltered semantic search, with optional
 * retrieval strategy overrides (MMR, cross-encoder). Uses ContextSourcePort
 * to look up active source IDs for a context without depending directly on
 * ContextManagementService.
 */
export class SearchKnowledge {
  private readonly _executeQuery: ExecuteSemanticQuery;

  constructor(
    private readonly _retrievalInfra: ResolvedSemanticQueryInfra,
    private readonly _contextSource: ContextSourcePort,
  ) {
    this._executeQuery = new ExecuteSemanticQuery(
      _retrievalInfra.queryEmbedder,
      _retrievalInfra.searchStrategy,
      _retrievalInfra.rankingStrategy,
    );
  }

  async execute(
    input: SearchKnowledgeInput,
  ): Promise<Result<KnowledgeError, SearchKnowledgeSuccess>> {
    try {
      let contextSourceIds: Set<string> | null = null;
      let vectorFilters = input.filters;

      if (input.filters?.contextId) {
        const contextId = input.filters.contextId as string;
        contextSourceIds = await this._contextSource.getActiveSourceIds(contextId);
        const { contextId: _, ...rest } = input.filters;
        vectorFilters = Object.keys(rest).length > 0 ? rest : undefined;
      }

      const fetchTopK = contextSourceIds
        ? (input.topK ?? 10) * 3
        : input.topK;

      const override = input.retrievalOverride;
      const useOverridePath = override && override.ranking !== "passthrough";

      let result: import("../../domain/RetrievalResult").RetrievalResult;

      if (useOverridePath) {
        // Build a one-shot ExecuteSemanticQuery with the override ranking strategy
        let rankingStrategy: import("../../domain/ports/RankingStrategy").RankingStrategy;

        if (override.ranking === "mmr") {
          const { MMRRankingStrategy } = await import(
            "../../infrastructure/ranking/MMRRankingStrategy"
          );
          rankingStrategy = new MMRRankingStrategy(override.mmrLambda ?? 0.5);
        } else if (override.ranking === "cross-encoder") {
          const { CrossEncoderRankingStrategy } = await import(
            "../../infrastructure/ranking/CrossEncoderRankingStrategy"
          );
          rankingStrategy = new CrossEncoderRankingStrategy(
            override.crossEncoderModel ?? "cross-encoder/ms-marco-MiniLM-L-6-v2",
          );
        } else {
          const { PassthroughRankingStrategy } = await import(
            "../../infrastructure/ranking/PassthroughRankingStrategy"
          );
          rankingStrategy = new PassthroughRankingStrategy();
        }

        const executor = new ExecuteSemanticQuery(
          this._retrievalInfra.queryEmbedder,
          this._retrievalInfra.searchStrategy,
          rankingStrategy,
        );

        result = await executor.execute({
          text: input.queryText,
          topK: fetchTopK,
          minScore: input.minScore,
          filters: vectorFilters,
        });
      } else {
        result = await this._executeQuery.execute({
          text: input.queryText,
          topK: fetchTopK,
          minScore: input.minScore,
          filters: vectorFilters,
        });
      }

      let items = result.items.map((item) => ({
        sourceId: item.sourceId,
        content: item.content,
        score: item.score,
        metadata: item.metadata as Record<string, unknown>,
      }));

      if (contextSourceIds) {
        items = items.filter((item) => contextSourceIds!.has(item.sourceId));
      }

      const topK = input.topK ?? 10;
      items = items.slice(0, topK);

      return Result.ok({
        queryText: result.queryText,
        items,
        totalFound: items.length,
      });
    } catch (error) {
      return Result.fail(
        KnowledgeError.fromStep(OperationStep.Search, error, []),
      );
    }
  }
}
