import type { VectorWriteStore } from "../../domain/ports/VectorWriteStore.js";
import type { VectorEntry } from "../../../../../platform/vector/VectorEntry";
import { NeDBStore } from "../../../../../platform/persistence/nedb/NeDBStore";
import { toDTO, type VectorEntryDTO } from "../../../../../platform/vector/VectorEntrySerialization";

export class NeDBVectorWriteStore implements VectorWriteStore {
  private store: NeDBStore<VectorEntryDTO>;

  constructor(filename?: string) {
    this.store = new NeDBStore<VectorEntryDTO>(filename);
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
    const matching = await this.store.find(
      (d) => d.semanticUnitId === semanticUnitId,
    );
    for (const dto of matching) {
      await this.store.remove(dto.id);
    }
  }
}
