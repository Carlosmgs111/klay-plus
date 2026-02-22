import type { VectorReadStore, SearchHit } from "../../domain/ports/VectorReadStore.js";
import { NeDBStore } from "../../../../../platform/persistence/nedb/NeDBStore.js";
import { cosineSimilarity } from "../../../../../platform/vector/hashVector.js";
import { fromDTO, type VectorEntryDTO } from "../../../../../platform/vector/VectorEntrySerialization.js";

/**
 * NeDB-backed VectorReadStore implementation.
 * Reads from the same NeDB file that the write side (NeDBVectorWriteStore) writes to.
 */
export class NeDBVectorReadStore implements VectorReadStore {
  private store: NeDBStore<VectorEntryDTO>;

  constructor(filename?: string) {
    this.store = new NeDBStore<VectorEntryDTO>(filename);
  }

  async search(
    queryVector: number[],
    topK: number,
    filter?: Record<string, unknown>,
  ): Promise<SearchHit[]> {
    let candidates = await this.store.getAll();

    if (filter) {
      candidates = candidates.filter((dto) =>
        Object.entries(filter).every(
          ([key, value]) => dto.metadata[key] === value,
        ),
      );
    }

    const scored: SearchHit[] = candidates.map((dto) => {
      const entry = fromDTO(dto);
      return {
        id: entry.id,
        semanticUnitId: entry.semanticUnitId,
        content: entry.content,
        score: cosineSimilarity(queryVector, entry.vector),
        metadata: entry.metadata,
      };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}
