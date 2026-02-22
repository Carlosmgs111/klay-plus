import type { KnowledgeLineageRepository } from "../../../domain/KnowledgeLineageRepository.js";
import type { KnowledgeLineage } from "../../../domain/KnowledgeLineage.js";
import type { LineageId } from "../../../domain/LineageId.js";
import { IndexedDBStore } from "../../../../../../platform/persistence/indexeddb/IndexedDBStore.js";
import { toDTO, fromDTO, type LineageDTO } from "./LineageDTO.js";

export class IndexedDBKnowledgeLineageRepository implements KnowledgeLineageRepository {
  private store: IndexedDBStore<LineageDTO>;

  constructor(dbName: string = "knowledge-platform") {
    this.store = new IndexedDBStore<LineageDTO>(dbName, "knowledge-lineage");
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
    const all = await this.store.getAll();
    const found = all.find((d) => d.semanticUnitId === semanticUnitId);
    return found ? fromDTO(found) : null;
  }
}
