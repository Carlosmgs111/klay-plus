import { BaseSparseReadStore } from "./BaseSparseReadStore";
import { NeDBStore } from "../../../../../platform/persistence/nedb/NeDBStore";
import { fromDTO, type VectorEntryDTO } from "../../../../../platform/vector/VectorEntrySerialization";
import type { VectorEntry } from "../../../../../platform/vector/VectorEntry";

/**
 * NeDB-backed BM25 sparse read store.
 * Reads from the same NeDB file as NeDBVectorReadStore.
 */
export class NeDBSparseReadStore extends BaseSparseReadStore {
  private store: NeDBStore<VectorEntryDTO>;

  constructor(filename?: string) {
    super();
    this.store = new NeDBStore<VectorEntryDTO>(filename);
  }

  protected async loadEntries(): Promise<VectorEntry[]> {
    const dtos = await this.store.getAll();
    return dtos.map(fromDTO);
  }
}
