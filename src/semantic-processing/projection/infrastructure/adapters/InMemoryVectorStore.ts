import type {
  VectorStoreAdapter,
  VectorEntry,
  VectorSearchResult,
} from "../../domain/ports/VectorStoreAdapter.js";
import { cosineSimilarity } from "../../../../shared/infrastructure/hashVector.js";

export class InMemoryVectorStore implements VectorStoreAdapter {
  private entries = new Map<string, VectorEntry>();

  async upsert(entries: VectorEntry[]): Promise<void> {
    for (const entry of entries) {
      this.entries.set(entry.id, entry);
    }
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.entries.delete(id);
    }
  }

  async deleteBySemanticUnitId(semanticUnitId: string): Promise<void> {
    for (const [id, entry] of this.entries) {
      if (entry.semanticUnitId === semanticUnitId) {
        this.entries.delete(id);
      }
    }
  }

  async search(
    vector: number[],
    topK: number,
    filter?: Record<string, unknown>,
  ): Promise<VectorSearchResult[]> {
    let candidates = [...this.entries.values()];

    if (filter) {
      candidates = candidates.filter((entry) =>
        Object.entries(filter).every(
          ([key, value]) => entry.metadata[key] === value,
        ),
      );
    }

    const scored: VectorSearchResult[] = candidates.map((entry) => ({
      entry,
      score: cosineSimilarity(vector, entry.vector),
    }));

    return scored.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  getEntryCount(): number {
    return this.entries.size;
  }
}
