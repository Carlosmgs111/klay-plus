import type { QueryEmbedder } from "../domain/ports/QueryEmbedder";
import type { VectorReadStore } from "../domain/ports/VectorReadStore";
import type { RankingStrategy } from "../domain/ports/RankingStrategy";

export { ExecuteSemanticQuery } from "./ExecuteSemanticQuery";
export type { ExecuteSemanticQueryCommand } from "./ExecuteSemanticQuery";

import { ExecuteSemanticQuery } from "./ExecuteSemanticQuery";

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
