import type { QueryEmbedder } from "../domain/ports/QueryEmbedder.js";
import type { VectorReadStore } from "../domain/ports/VectorReadStore.js";
import type { RankingStrategy } from "../domain/ports/RankingStrategy.js";

export { ExecuteSemanticQuery } from "./ExecuteSemanticQuery.js";
export type { ExecuteSemanticQueryCommand } from "./ExecuteSemanticQuery.js";

import { ExecuteSemanticQuery } from "./ExecuteSemanticQuery.js";

export class SemanticQueryUseCases {
  readonly executeSemanticQuery: ExecuteSemanticQuery;

  constructor(
    queryEmbedder: QueryEmbedder,
    vectorSearch: VectorReadStore,
    rankingStrategy: RankingStrategy,
  ) {
    this.executeSemanticQuery = new ExecuteSemanticQuery(
      queryEmbedder,
      vectorSearch,
      rankingStrategy,
    );
  }
}
