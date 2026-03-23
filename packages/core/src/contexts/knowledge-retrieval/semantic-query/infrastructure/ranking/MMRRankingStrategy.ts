import type {
  RankingStrategy,
  RankedHit,
} from "../../domain/ports/RankingStrategy";
import type { SearchHit } from "../../domain/ports/VectorReadStore";
import { cosineSimilarity } from "../../../../../shared/vector/hashVector";

/**
 * Maximal Marginal Relevance ranking strategy.
 * Balances relevance to the query with diversity among selected results.
 *
 * lambda=1.0 → pure relevance (equivalent to passthrough)
 * lambda=0.0 → pure diversity
 * lambda=0.5 → balanced (default)
 */
export class MMRRankingStrategy implements RankingStrategy {
  constructor(private readonly lambda: number = 0.5) {}

  async rerank(
    _query: string,
    queryVector: number[],
    hits: SearchHit[],
  ): Promise<RankedHit[]> {
    const selected: RankedHit[] = [];
    const candidates = [...hits];

    while (candidates.length > 0 && selected.length < hits.length) {
      let best = -Infinity;
      let bestIdx = 0;

      candidates.forEach((c, i) => {
        const relevance = cosineSimilarity(queryVector, c.vector);
        const redundancy =
          selected.length > 0
            ? Math.max(...selected.map((s) => cosineSimilarity(s.vector, c.vector)))
            : 0;
        const score = this.lambda * relevance - (1 - this.lambda) * redundancy;
        if (score > best) {
          best = score;
          bestIdx = i;
        }
      });

      selected.push({ ...candidates[bestIdx], rerankedScore: best });
      candidates.splice(bestIdx, 1);
    }

    return selected;
  }
}
