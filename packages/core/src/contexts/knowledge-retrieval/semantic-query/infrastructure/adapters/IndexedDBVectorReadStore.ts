import type { VectorReadStore, SearchHit } from "../../domain/ports/VectorReadStore";
import { IndexedDBStore } from "../../../../../platform/persistence/indexeddb/IndexedDBStore";
import { cosineSimilarity } from "../../../../../platform/vector/hashVector";
import { fromDTO, type VectorEntryDTO } from "../../../../../platform/vector/VectorEntrySerialization";

/**
 * IndexedDB-backed VectorReadStore implementation.
 * Reads from the same IndexedDB store that the write side (IndexedDBVectorWriteStore) writes to.
 */
export class IndexedDBVectorReadStore implements VectorReadStore {
  private store: IndexedDBStore<VectorEntryDTO>;

  constructor(dbName: string = "knowledge-platform") {
    this.store = new IndexedDBStore<VectorEntryDTO>(dbName, "vector-entries");
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
