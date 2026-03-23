import { BaseSparseReadStore } from "./BaseSparseReadStore";
import { NeDBStore } from "../../../../../shared/persistence/nedb/NeDBStore";
import { fromDTO, type VectorEntryDTO } from "../../../../../shared/vector/VectorEntrySerialization";
import type { VectorEntry } from "../../../../../shared/vector/VectorEntry";

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
