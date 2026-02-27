import type { VectorReadStore, SearchHit } from "../../domain/ports/VectorReadStore";
import type { VectorEntry } from "../../../../../platform/vector/VectorEntry";
import { cosineSimilarity } from "../../../../../platform/vector/hashVector";

/**
 * In-memory VectorReadStore implementation.
 * Receives a shared Map<string, VectorEntry> from the write side
 * to read vectors without cross-context coupling.
 */
export class InMemoryVectorReadStore implements VectorReadStore {
  constructor(private readonly entries: Map<string, VectorEntry>) {}

  async search(
    queryVector: number[],
    topK: number,
    filter?: Record<string, unknown>,
  ): Promise<SearchHit[]> {
    let candidates = [...this.entries.values()];

    if (filter) {
      candidates = candidates.filter((entry) =>
        Object.entries(filter).every(
          ([key, value]) => entry.metadata[key] === value,
        ),
      );
    }

    const scored: SearchHit[] = candidates.map((entry) => ({
      id: entry.id,
      semanticUnitId: entry.semanticUnitId,
      content: entry.content,
      score: cosineSimilarity(queryVector, entry.vector),
      metadata: entry.metadata,
    }));

    return scored.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}
