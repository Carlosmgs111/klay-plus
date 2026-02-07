import type { QueryEmbedder } from "../domain/ports/QueryEmbedder.js";
import type { VectorSearchAdapter } from "../domain/ports/VectorSearchAdapter.js";
import type { RankingStrategy } from "../domain/ports/RankingStrategy.js";
export { ExecuteSemanticQuery } from "./ExecuteSemanticQuery.js";
export type { ExecuteSemanticQueryCommand } from "./ExecuteSemanticQuery.js";
import { ExecuteSemanticQuery } from "./ExecuteSemanticQuery.js";
export declare class SemanticQueryUseCases {
    readonly executeSemanticQuery: ExecuteSemanticQuery;
    constructor(queryEmbedder: QueryEmbedder, vectorSearch: VectorSearchAdapter, rankingStrategy: RankingStrategy);
}
//# sourceMappingURL=index.d.ts.map