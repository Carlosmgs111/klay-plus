import type { SearchStrategy } from "../../domain/ports/SearchStrategy";
import type { SearchHit, VectorReadStore } from "../../domain/ports/VectorReadStore";
import type { SparseReadStore } from "../../domain/ports/SparseReadStore";

function deduplicateById(hits: SearchHit[]): SearchHit[] {
  const seen = new Map<string, SearchHit>();
  for (const hit of hits) {
    if (!seen.has(hit.id)) seen.set(hit.id, hit);
  }
  return [...seen.values()];
}

/**
 * Hybrid search strategy combining dense vector search and BM25 sparse search
 * via Reciprocal Rank Fusion (RRF).
 *
 * RRF constant k=60 (standard default from the original paper).
 */
export class HybridSearchStrategy implements SearchStrategy {
  constructor(
    private readonly dense: VectorReadStore,
    private readonly sparse: SparseReadStore,
    private readonly k: number = 60,
  ) {}

  async search(
    { vector, text }: { vector: number[]; text: string },
    topK: number,
    filter?: Record<string, unknown>,
  ): Promise<SearchHit[]> {
    const [denseHits, sparseHits] = await Promise.all([
      this.dense.search(vector, topK * 2, filter),
      this.sparse.search(text, topK * 2, filter),
    ]);

    return this.rrfMerge(denseHits, sparseHits, topK);
  }

  private rrfMerge(dense: SearchHit[], sparse: SearchHit[], topK: number): SearchHit[] {
    const scores = new Map<string, number>();

    dense.forEach((h, rank) => {
      scores.set(h.id, (scores.get(h.id) ?? 0) + 1 / (this.k + rank + 1));
    });
    sparse.forEach((h, rank) => {
      scores.set(h.id, (scores.get(h.id) ?? 0) + 1 / (this.k + rank + 1));
    });

    const allHits = deduplicateById([...dense, ...sparse]);
    return allHits
      .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0))
      .slice(0, topK)
      .map((h) => ({ ...h, score: scores.get(h.id) ?? 0 }));
  }
}
