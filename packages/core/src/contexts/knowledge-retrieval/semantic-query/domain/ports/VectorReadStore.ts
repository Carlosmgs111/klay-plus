export interface SearchHit {
  id: string;
  semanticUnitId: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface VectorReadStore {
  search(
    queryVector: number[],
    topK: number,
    filter?: Record<string, unknown>,
  ): Promise<SearchHit[]>;
}
