import type { VectorStoreAdapter, VectorEntry, VectorSearchResult } from "../../domain/ports/VectorStoreAdapter.js";
export declare class InMemoryVectorStore implements VectorStoreAdapter {
    private entries;
    upsert(entries: VectorEntry[]): Promise<void>;
    delete(ids: string[]): Promise<void>;
    deleteBySemanticUnitId(semanticUnitId: string): Promise<void>;
    search(vector: number[], topK: number, filter?: Record<string, unknown>): Promise<VectorSearchResult[]>;
    getEntryCount(): number;
}
//# sourceMappingURL=InMemoryVectorStore.d.ts.map