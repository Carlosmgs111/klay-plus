import { ExecuteSemanticQuery } from "./application/ExecuteSemanticQuery.js";
import type { QueryEmbedder } from "./domain/ports/QueryEmbedder.js";
import type { VectorSearchAdapter } from "./domain/ports/VectorSearchAdapter.js";
import type { RankingStrategy } from "./domain/ports/RankingStrategy.js";

export class SemanticQueryUseCases {
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
