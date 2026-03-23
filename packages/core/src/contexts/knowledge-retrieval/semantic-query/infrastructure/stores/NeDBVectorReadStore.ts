import { BaseVectorReadStore } from "./BaseVectorReadStore";
import { NeDBStore } from "../../../../../shared/persistence/nedb/NeDBStore";
import { fromDTO, type VectorEntryDTO } from "../../../../../shared/vector/VectorEntrySerialization";
import type { VectorEntry } from "../../../../../shared/vector/VectorEntry";

/**
 * NeDB-backed VectorReadStore implementation.
 * Reads from the same NeDB file that the write side (NeDBVectorWriteStore) writes to.
 */
export class NeDBVectorReadStore extends BaseVectorReadStore {
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
