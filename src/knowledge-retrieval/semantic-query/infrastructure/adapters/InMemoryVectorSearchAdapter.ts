import type {
  VectorSearchAdapter,
  SearchHit,
} from "../../domain/ports/VectorSearchAdapter.js";
import type {
  VectorStoreAdapter,
} from "../../../../semantic-processing/projection/domain/ports/VectorStoreAdapter.js";

/**
 * Bridges the retrieval context to the processing context's vector store.
 * In production, both contexts would talk to the same vector DB (e.g., Pinecone).
 * Here, we pass the same InMemoryVectorStore instance via composition.
 */
export class InMemoryVectorSearchAdapter implements VectorSearchAdapter {
  constructor(private readonly vectorStore: VectorStoreAdapter) {}

  async search(
    queryVector: number[],
    topK: number,
    filter?: Record<string, unknown>,
  ): Promise<SearchHit[]> {
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
