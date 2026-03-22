import type { SearchStrategy } from "../../domain/ports/SearchStrategy";
import type { SearchHit, VectorReadStore } from "../../domain/ports/VectorReadStore";

/**
 * Dense-only search strategy.
 * Thin adapter over VectorReadStore to implement the SearchStrategy port.
 */
export class DenseSearchStrategy implements SearchStrategy {
  constructor(private readonly store: VectorReadStore) {}

  search(
    { vector }: { vector: number[]; text: string },
    topK: number,
    filter?: Record<string, unknown>,
  ): Promise<SearchHit[]> {
    return this.store.search(vector, topK, filter);
  }
}
