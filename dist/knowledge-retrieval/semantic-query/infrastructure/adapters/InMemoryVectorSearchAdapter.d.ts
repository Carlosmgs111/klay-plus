import type { VectorSearchAdapter, SearchHit } from "../../domain/ports/VectorSearchAdapter.js";
import type { VectorStoreAdapter } from "../../../../semantic-processing/projection/domain/ports/VectorStoreAdapter.js";
/**
 * Bridges the retrieval context to the processing context's vector store.
 * In production, both contexts would talk to the same vector DB (e.g., Pinecone).
 * Here, we pass the same InMemoryVectorStore instance via composition.
 */
export declare class InMemoryVectorSearchAdapter implements VectorSearchAdapter {
    private readonly vectorStore;
    constructor(vectorStore: VectorStoreAdapter);
    search(queryVector: number[], topK: number, filter?: Record<string, unknown>): Promise<SearchHit[]>;
}
//# sourceMappingURL=InMemoryVectorSearchAdapter.d.ts.map