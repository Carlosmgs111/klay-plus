import type { VectorWriteStore } from "../../domain/ports/VectorWriteStore.js";
import type { VectorEntry } from "../../../../../platform/vector/VectorEntry.js";
import { IndexedDBStore } from "../../../../../platform/persistence/indexeddb/IndexedDBStore.js";
import { toDTO, type VectorEntryDTO } from "../../../../../platform/vector/VectorEntrySerialization.js";

export class IndexedDBVectorWriteStore implements VectorWriteStore {
  private store: IndexedDBStore<VectorEntryDTO>;

  constructor(dbName: string = "knowledge-platform") {
    this.store = new IndexedDBStore<VectorEntryDTO>(dbName, "vector-entries");
  }

  async upsert(entries: VectorEntry[]): Promise<void> {
    for (const entry of entries) {
      await this.store.put(entry.id, toDTO(entry));
    }
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.store.remove(id);
    }
  }

  async deleteBySemanticUnitId(semanticUnitId: string): Promise<void> {
    const all = await this.store.getAll();
    const matching = all.filter((d) => d.semanticUnitId === semanticUnitId);
    for (const dto of matching) {
      await this.store.remove(dto.id);
    }
  }
}
