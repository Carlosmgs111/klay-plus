export interface SearchHit {
  id: string;
  sourceId: string;
  content: string;
  score: number;
  vector: number[];
  metadata: Record<string, unknown>;
}

export interface VectorReadStore {
  search(
    queryVector: number[],
    topK: number,
    filter?: Record<string, unknown>,
  ): Promise<SearchHit[]>;
}
