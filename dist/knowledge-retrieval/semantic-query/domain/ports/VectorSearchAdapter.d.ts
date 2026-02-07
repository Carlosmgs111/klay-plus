export interface SearchHit {
    id: string;
    semanticUnitId: string;
    content: string;
    score: number;
    metadata: Record<string, unknown>;
}
export interface VectorSearchAdapter {
    search(queryVector: number[], topK: number, filter?: Record<string, unknown>): Promise<SearchHit[]>;
}
//# sourceMappingURL=VectorSearchAdapter.d.ts.map