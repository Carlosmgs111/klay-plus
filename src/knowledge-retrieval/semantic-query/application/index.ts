import type { QueryEmbedder } from "../domain/ports/QueryEmbedder.js";
import type { VectorSearchAdapter } from "../domain/ports/VectorSearchAdapter.js";
import type { RankingStrategy } from "../domain/ports/RankingStrategy.js";

// ─── Use Cases ─────────────────────────────────────────────────────
export { ExecuteSemanticQuery } from "./ExecuteSemanticQuery.js";
export type { ExecuteSemanticQueryCommand } from "./ExecuteSemanticQuery.js";

// ─── Use Cases Facade ──────────────────────────────────────────────
import { ExecuteSemanticQuery } from "./ExecuteSemanticQuery.js";

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
