import type { SourceRepository } from "../../../domain/SourceRepository.js";
import type { Source } from "../../../domain/Source.js";
import type { SourceId } from "../../../domain/SourceId.js";
import type { SourceType } from "../../../domain/SourceType.js";
import { NeDBStore } from "../../../../../../platform/persistence/nedb/NeDBStore.js";
import { toDTO, fromDTO, type SourceDTO } from "../indexeddb/SourceDTO.js";

export class NeDBSourceRepository implements SourceRepository {
  private store: NeDBStore<SourceDTO>;

  constructor(filename?: string) {
    this.store = new NeDBStore<SourceDTO>(filename);
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
    const results = await this.store.find((d) => d.type === type);
    return results.map(fromDTO);
  }

  async findByUri(uri: string): Promise<Source | null> {
    const found = await this.store.findOne((d) => d.uri === uri);
    return found ? fromDTO(found) : null;
  }

  async exists(id: SourceId): Promise<boolean> {
    return this.store.has(id.value);
  }
}
