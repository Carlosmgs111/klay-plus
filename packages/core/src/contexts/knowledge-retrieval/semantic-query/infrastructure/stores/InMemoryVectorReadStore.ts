import { BaseVectorReadStore } from "./BaseVectorReadStore";
import type { VectorEntry } from "../../../../../shared/vector/VectorEntry";

/**
 * In-memory VectorReadStore implementation.
 * Receives a shared Map<string, VectorEntry> from the write side
 * to read vectors without cross-context coupling.
 */
export class InMemoryVectorReadStore extends BaseVectorReadStore {
  constructor(private readonly entries: Map<string, VectorEntry>) {
    super();
  }

  protected async loadEntries(): Promise<VectorEntry[]> {
    return [...this.entries.values()];
  }
}
