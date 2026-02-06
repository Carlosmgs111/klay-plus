import type {
  RankingStrategy,
  RankedHit,
} from "../../domain/ports/RankingStrategy.js";
import type { SearchHit } from "../../domain/ports/VectorSearchAdapter.js";

/**
 * No-op ranking strategy that preserves the original vector similarity score.
 * Suitable for cases where reranking is not needed or not available.
 */
export class PassthroughRankingStrategy implements RankingStrategy {
  async rerank(_query: string, hits: SearchHit[]): Promise<RankedHit[]> {
    return hits
      .map((hit) => ({ ...hit, rerankedScore: hit.score }))
      .sort((a, b) => b.rerankedScore - a.rerankedScore);
  }
}
