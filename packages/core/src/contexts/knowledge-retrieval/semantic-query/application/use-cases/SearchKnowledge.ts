import type { ResolvedSemanticQueryInfra } from "../../composition/factory";
import type { SearchKnowledgeInput, SearchKnowledgeSuccess } from "../../../../../application/dtos";
import { Result } from "../../../../../shared/domain/Result";
import { type StepError, stepError } from "../../../../../shared/domain/errors/stepError";
import { ExecuteSemanticQuery } from "./ExecuteSemanticQuery";

/**
 * SearchKnowledge — Pure semantic search use case.
 *
 * No context dependency. Accepts optional sourceIds filter for
 * context-scoped search (resolved by application layer).
 */
export class SearchKnowledge {
  private readonly _executeQuery: ExecuteSemanticQuery;

  constructor(
    private readonly _retrievalInfra: ResolvedSemanticQueryInfra,
  ) {
    this._executeQuery = new ExecuteSemanticQuery(
      _retrievalInfra.queryEmbedder,
      _retrievalInfra.searchStrategy,
      _retrievalInfra.rankingStrategy,
    );
  }

  async execute(
    input: SearchKnowledgeInput,
  ): Promise<Result<StepError, SearchKnowledgeSuccess>> {
    try {
      // Extract sourceIds filter (set by application layer for context-scoped search)
      let sourceIds: Set<string> | undefined;
      let vectorFilters = input.filters;

      if (input.filters?.sourceIds) {
        sourceIds = new Set(input.filters.sourceIds as string[]);
        const { sourceIds: _, ...rest } = input.filters;
        vectorFilters = Object.keys(rest).length > 0 ? rest : undefined;
      }

      // Also handle legacy contextId filter by stripping it (app layer resolves it)
      if (vectorFilters?.contextId) {
        const { contextId: _, ...rest } = vectorFilters;
        vectorFilters = Object.keys(rest).length > 0 ? rest : undefined;
      }

      const fetchTopK = sourceIds
        ? (input.topK ?? 10) * 3
        : input.topK;

      const override = input.retrievalOverride;
      const useOverridePath = override && override.ranking !== "passthrough";

      let result: import("../../domain/RetrievalResult").RetrievalResult;

      if (useOverridePath) {
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

      if (sourceIds) {
        items = items.filter((item) => sourceIds!.has(item.sourceId));
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
        stepError("search", error),
      );
    }
  }
}
