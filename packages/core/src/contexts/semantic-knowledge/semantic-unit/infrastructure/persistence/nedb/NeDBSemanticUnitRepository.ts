import type { SemanticUnitRepository } from "../../../domain/SemanticUnitRepository.js";
import type { SemanticUnit } from "../../../domain/SemanticUnit.js";
import type { SemanticUnitId } from "../../../domain/SemanticUnitId.js";
import type { SemanticState } from "../../../domain/SemanticState.js";
import { NeDBStore } from "../../../../../../platform/persistence/nedb/NeDBStore.js";
import { toDTO, fromDTO, type SemanticUnitDTO } from "../indexeddb/SemanticUnitDTO.js";

export class NeDBSemanticUnitRepository implements SemanticUnitRepository {
  private store: NeDBStore<SemanticUnitDTO>;

  constructor(filename?: string) {
    this.store = new NeDBStore<SemanticUnitDTO>(filename);
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
    const results = await this.store.find(
      (d) => d.origins?.some((o) => o.sourceId === sourceId) ?? d.origin?.sourceId === sourceId,
    );
    return results.map(fromDTO);
  }

  async findByState(state: SemanticState): Promise<SemanticUnit[]> {
    const results = await this.store.find((d) => d.state === state);
    return results.map(fromDTO);
  }

  async findByTags(tags: string[]): Promise<SemanticUnit[]> {
    const tagSet = new Set(tags);
    const results = await this.store.find((d) =>
      d.metadata.tags.some((t) => tagSet.has(t)),
    );
    return results.map(fromDTO);
  }

  async exists(id: SemanticUnitId): Promise<boolean> {
    return this.store.has(id.value);
  }
}
