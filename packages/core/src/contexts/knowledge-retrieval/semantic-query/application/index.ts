import type { QueryEmbedder } from "../domain/ports/QueryEmbedder";
import type { SearchStrategy } from "../domain/ports/SearchStrategy";
import type { RankingStrategy } from "../domain/ports/RankingStrategy";
import type { QueryExpander } from "../domain/ports/QueryExpander";

export { ExecuteSemanticQuery } from "./ExecuteSemanticQuery";
export type { ExecuteSemanticQueryCommand } from "./ExecuteSemanticQuery";

import { ExecuteSemanticQuery } from "./ExecuteSemanticQuery";

export class SemanticQueryUseCases {
  readonly executeSemanticQuery: ExecuteSemanticQuery;

  constructor(
    queryEmbedder: QueryEmbedder,
    searchStrategy: SearchStrategy,
    rankingStrategy: RankingStrategy,
    expander?: QueryExpander,
  ) {
    this.executeSemanticQuery = new ExecuteSemanticQuery(
      queryEmbedder,
      searchStrategy,
      rankingStrategy,
      expander,
    );
  }
}
