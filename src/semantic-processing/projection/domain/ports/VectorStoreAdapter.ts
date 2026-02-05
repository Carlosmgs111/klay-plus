export interface VectorEntry {
  id: string;
  semanticUnitId: string;
  vector: number[];
  content: string;
  metadata: Record<string, unknown>;
}

export interface VectorSearchResult {
  entry: VectorEntry;
  score: number;
}

export interface VectorStoreAdapter {
  upsert(entries: VectorEntry[]): Promise<void>;
  delete(ids: string[]): Promise<void>;
  deleteBySemanticUnitId(semanticUnitId: string): Promise<void>;
  search(vector: number[], topK: number, filter?: Record<string, unknown>): Promise<VectorSearchResult[]>;
}
