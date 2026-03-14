import { BaseVectorReadStore } from "./BaseVectorReadStore";
import { IndexedDBStore } from "../../../../../platform/persistence/indexeddb/IndexedDBStore";
import { fromDTO, type VectorEntryDTO } from "../../../../../platform/vector/VectorEntrySerialization";
import type { VectorEntry } from "../../../../../platform/vector/VectorEntry";

/**
 * IndexedDB-backed VectorReadStore implementation.
 * Reads from the same IndexedDB store that the write side (IndexedDBVectorWriteStore) writes to.
 */
export class IndexedDBVectorReadStore extends BaseVectorReadStore {
  private store: IndexedDBStore<VectorEntryDTO>;

  constructor(dbName: string = "knowledge-platform") {
    super();
    this.store = new IndexedDBStore<VectorEntryDTO>(dbName, "vector-entries");
  }

  protected async loadEntries(): Promise<VectorEntry[]> {
    const dtos = await this.store.getAll();
    return dtos.map(fromDTO);
  }
}
