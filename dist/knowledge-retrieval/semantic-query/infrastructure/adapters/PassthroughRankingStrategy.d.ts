import type { RankingStrategy, RankedHit } from "../../domain/ports/RankingStrategy.js";
import type { SearchHit } from "../../domain/ports/VectorSearchAdapter.js";
/**
 * No-op ranking strategy that preserves the original vector similarity score.
 * Suitable for cases where reranking is not needed or not available.
 */
export declare class PassthroughRankingStrategy implements RankingStrategy {
    rerank(_query: string, hits: SearchHit[]): Promise<RankedHit[]>;
}
//# sourceMappingURL=PassthroughRankingStrategy.d.ts.map