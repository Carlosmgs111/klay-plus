import { BaseSparseReadStore } from "./BaseSparseReadStore";
import { IndexedDBStore } from "../../../../../shared/persistence/indexeddb/IndexedDBStore";
import { fromDTO, type VectorEntryDTO } from "../../../../../shared/vector/VectorEntrySerialization";
import type { VectorEntry } from "../../../../../shared/vector/VectorEntry";

/**
 * IndexedDB-backed BM25 sparse read store.
 * Reads from the same IndexedDB store as IndexedDBVectorReadStore.
 */
export class IndexedDBSparseReadStore extends BaseSparseReadStore {
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
