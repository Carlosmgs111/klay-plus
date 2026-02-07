/**
 * Bridges the retrieval context to the processing context's vector store.
 * In production, both contexts would talk to the same vector DB (e.g., Pinecone).
 * Here, we pass the same InMemoryVectorStore instance via composition.
 */
export class InMemoryVectorSearchAdapter {
    vectorStore;
    constructor(vectorStore) {
        this.vectorStore = vectorStore;
    }
    async search(queryVector, topK, filter) {
        const results = await this.vectorStore.search(queryVector, topK, filter);
        return results.map((r) => ({
            id: r.entry.id,
            semanticUnitId: r.entry.semanticUnitId,
            content: r.entry.content,
            score: r.score,
            metadata: r.entry.metadata,
        }));
    }
}
//# sourceMappingURL=InMemoryVectorSearchAdapter.js.map