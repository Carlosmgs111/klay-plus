import type { SearchHit } from "./VectorReadStore";

export interface SparseReadStore {
  search(
    queryText: string,
    topK: number,
    filter?: Record<string, unknown>,
  ): Promise<SearchHit[]>;
}
