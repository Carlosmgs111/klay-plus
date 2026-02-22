import type { SourceRepository } from "../../../domain/SourceRepository.js";
import type { Source } from "../../../domain/Source.js";
import type { SourceId } from "../../../domain/SourceId.js";
import type { SourceType } from "../../../domain/SourceType.js";
import { IndexedDBStore } from "../../../../../../platform/persistence/indexeddb/IndexedDBStore.js";
import { toDTO, fromDTO, type SourceDTO } from "./SourceDTO.js";

export class IndexedDBSourceRepository implements SourceRepository {
  private store: IndexedDBStore<SourceDTO>;

  constructor(dbName: string = "knowledge-platform") {
    this.store = new IndexedDBStore<SourceDTO>(dbName, "sources");
  }

  async save(entity: Source): Promise<void> {
    await this.store.put(entity.id.value, toDTO(entity));
  }

  async findById(id: SourceId): Promise<Source | null> {
    const dto = await this.store.get(id.value);
    return dto ? fromDTO(dto) : null;
  }

  async delete(id: SourceId): Promise<void> {
    await this.store.remove(id.value);
  }

  async findByType(type: SourceType): Promise<Source[]> {
    const all = await this.store.getAll();
    return all.filter((d) => d.type === type).map(fromDTO);
  }

  async findByUri(uri: string): Promise<Source | null> {
    const all = await this.store.getAll();
    const found = all.find((d) => d.uri === uri);
    return found ? fromDTO(found) : null;
  }

  async exists(id: SourceId): Promise<boolean> {
    return this.store.has(id.value);
  }
}
