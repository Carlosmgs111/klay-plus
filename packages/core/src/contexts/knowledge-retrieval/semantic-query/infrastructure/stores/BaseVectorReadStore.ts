import type { VectorReadStore, SearchHit } from "../../domain/ports/VectorReadStore";
import type { VectorEntry } from "../../../../../platform/vector/VectorEntry";
import { cosineSimilarity } from "../../../../../platform/vector/hashVector";

/**
 * Base class for VectorReadStore implementations.
 * Encapsulates the shared search pipeline: filter -> score -> sort -> slice.
 * Subclasses only implement `loadEntries()` to provide data from their storage backend.
 */
export abstract class BaseVectorReadStore implements VectorReadStore {
  protected abstract loadEntries(): Promise<VectorEntry[]>;

  async search(
    queryVector: number[],
    topK: number,
    filter?: Record<string, unknown>,
  ): Promise<SearchHit[]> {
    let candidates = await this.loadEntries();

    if (filter) {
      candidates = candidates.filter((entry) =>
        Object.entries(filter).every(
          ([key, value]) => entry.metadata[key] === value,
        ),
      );
    }

    const scored: SearchHit[] = candidates.map((entry) => ({
      id: entry.id,
      sourceId: entry.sourceId,
      content: entry.content,
      score: cosineSimilarity(queryVector, entry.vector),
      vector: entry.vector,
      metadata: entry.metadata,
    }));

    return scored.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}
