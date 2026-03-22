import type { SearchHit } from "./VectorReadStore";

export interface SearchStrategy {
  search(
    query: { vector: number[]; text: string },
    topK: number,
    filter?: Record<string, unknown>,
  ): Promise<SearchHit[]>;
}
