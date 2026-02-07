import { RetrievalResult } from "../domain/RetrievalResult.js";
import type { QueryEmbedder } from "../domain/ports/QueryEmbedder.js";
import type { VectorSearchAdapter } from "../domain/ports/VectorSearchAdapter.js";
import type { RankingStrategy } from "../domain/ports/RankingStrategy.js";
export interface ExecuteSemanticQueryCommand {
    text: string;
    topK?: number;
    filters?: Record<string, unknown>;
    minScore?: number;
}
export declare class ExecuteSemanticQuery {
    private readonly embedder;
    private readonly vectorSearch;
    private readonly rankingStrategy;
    constructor(embedder: QueryEmbedder, vectorSearch: VectorSearchAdapter, rankingStrategy: RankingStrategy);
    execute(command: ExecuteSemanticQueryCommand): Promise<RetrievalResult>;
}
//# sourceMappingURL=ExecuteSemanticQuery.d.ts.map