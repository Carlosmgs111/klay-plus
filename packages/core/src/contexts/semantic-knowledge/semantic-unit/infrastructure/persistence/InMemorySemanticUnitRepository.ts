import type { SemanticUnitRepository } from "../../domain/SemanticUnitRepository.js";
import type { SemanticUnit } from "../../domain/SemanticUnit.js";
import type { SemanticUnitId } from "../../domain/SemanticUnitId.js";
import type { SemanticState } from "../../domain/SemanticState.js";

export class InMemorySemanticUnitRepository implements SemanticUnitRepository {
  private store = new Map<string, SemanticUnit>();

  async save(entity: SemanticUnit): Promise<void> {
    this.store.set(entity.id.value, entity);
  }

  async findById(id: SemanticUnitId): Promise<SemanticUnit | null> {
    return this.store.get(id.value) ?? null;
  }

  async delete(id: SemanticUnitId): Promise<void> {
    this.store.delete(id.value);
  }

  async findBySourceId(sourceId: string): Promise<SemanticUnit[]> {
    return [...this.store.values()].filter((u) =>
      u.allSources.some((s) => s.sourceId === sourceId),
    );
  }

  async findByState(state: SemanticState): Promise<SemanticUnit[]> {
    return [...this.store.values()].filter((u) => u.state === state);
  }

  async findByTags(tags: string[]): Promise<SemanticUnit[]> {
    const tagSet = new Set(tags);
    return [...this.store.values()].filter((u) =>
      u.metadata.tags.some((t) => tagSet.has(t)),
    );
  }

  async exists(id: SemanticUnitId): Promise<boolean> {
    return this.store.has(id.value);
  }
}
