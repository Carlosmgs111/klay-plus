import { ExecuteSemanticQuery } from "./semantic-query/application/ExecuteSemanticQuery.js";
import type { QueryEmbedder } from "./semantic-query/domain/ports/QueryEmbedder.js";
import type { VectorSearchAdapter } from "./semantic-query/domain/ports/VectorSearchAdapter.js";
import type { RankingStrategy } from "./semantic-query/domain/ports/RankingStrategy.js";

export class KnowledgeRetrievalUseCases {
  readonly executeSemanticQuery: ExecuteSemanticQuery;

  constructor(
    queryEmbedder: QueryEmbedder,
    vectorSearch: VectorSearchAdapter,
    rankingStrategy: RankingStrategy,
  ) {
    this.executeSemanticQuery = new ExecuteSemanticQuery(
      queryEmbedder,
      vectorSearch,
      rankingStrategy,
    );
  }
}
