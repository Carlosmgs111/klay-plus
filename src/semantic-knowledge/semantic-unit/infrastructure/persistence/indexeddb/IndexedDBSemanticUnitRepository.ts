import type { SemanticUnitRepository } from "../../../domain/SemanticUnitRepository.js";
import type { SemanticUnit } from "../../../domain/SemanticUnit.js";
import type { SemanticUnitId } from "../../../domain/SemanticUnitId.js";
import type { SemanticState } from "../../../domain/SemanticState.js";
import { IndexedDBStore } from "../../../../../shared/infrastructure/indexeddb/IndexedDBStore.js";
import { toDTO, fromDTO, type SemanticUnitDTO } from "./SemanticUnitDTO.js";

export class IndexedDBSemanticUnitRepository implements SemanticUnitRepository {
  private store: IndexedDBStore<SemanticUnitDTO>;

  constructor(dbName: string = "knowledge-platform") {
    this.store = new IndexedDBStore<SemanticUnitDTO>(dbName, "semantic-units");
  }

  async save(entity: SemanticUnit): Promise<void> {
    await this.store.put(entity.id.value, toDTO(entity));
  }

  async findById(id: SemanticUnitId): Promise<SemanticUnit | null> {
    const dto = await this.store.get(id.value);
    return dto ? fromDTO(dto) : null;
  }

  async delete(id: SemanticUnitId): Promise<void> {
    await this.store.remove(id.value);
  }

  async findByOriginSourceId(sourceId: string): Promise<SemanticUnit[]> {
    const all = await this.store.getAll();
    return all.filter((d) => d.origin.sourceId === sourceId).map(fromDTO);
  }

  async findByState(state: SemanticState): Promise<SemanticUnit[]> {
    const all = await this.store.getAll();
    return all.filter((d) => d.state === state).map(fromDTO);
  }

  async findByTags(tags: string[]): Promise<SemanticUnit[]> {
    const tagSet = new Set(tags);
    const all = await this.store.getAll();
    return all
      .filter((d) => d.metadata.tags.some((t) => tagSet.has(t)))
      .map(fromDTO);
  }

  async exists(id: SemanticUnitId): Promise<boolean> {
    return this.store.has(id.value);
  }
}
