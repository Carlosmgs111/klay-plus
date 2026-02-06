import type { KnowledgeLineageRepository } from "../../../domain/KnowledgeLineageRepository.js";
import type { KnowledgeLineage } from "../../../domain/KnowledgeLineage.js";
import type { LineageId } from "../../../domain/LineageId.js";
import { NeDBStore } from "../../../../../shared/infrastructure/nedb/NeDBStore.js";
import { toDTO, fromDTO, type LineageDTO } from "../indexeddb/LineageDTO.js";

export class NeDBKnowledgeLineageRepository implements KnowledgeLineageRepository {
  private store: NeDBStore<LineageDTO>;

  constructor(filename?: string) {
    this.store = new NeDBStore<LineageDTO>(filename);
  }

  async save(entity: KnowledgeLineage): Promise<void> {
    await this.store.put(entity.id.value, toDTO(entity));
  }

  async findById(id: LineageId): Promise<KnowledgeLineage | null> {
    const dto = await this.store.get(id.value);
    return dto ? fromDTO(dto) : null;
  }

  async delete(id: LineageId): Promise<void> {
    await this.store.remove(id.value);
  }

  async findBySemanticUnitId(semanticUnitId: string): Promise<KnowledgeLineage | null> {
    const found = await this.store.findOne((d) => d.semanticUnitId === semanticUnitId);
    return found ? fromDTO(found) : null;
  }
}
