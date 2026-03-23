import { BaseSparseReadStore } from "./BaseSparseReadStore";
import type { VectorEntry } from "../../../../../shared/vector/VectorEntry";

/**
 * In-memory BM25 sparse read store.
 * Receives the same shared Map<string, VectorEntry> as InMemoryVectorReadStore.
 */
export class InMemorySparseReadStore extends BaseSparseReadStore {
  constructor(private readonly entries: Map<string, VectorEntry>) {
    super();
  }

  protected async loadEntries(): Promise<VectorEntry[]> {
    return [...this.entries.values()];
  }
}
