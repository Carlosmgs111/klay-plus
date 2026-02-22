import type { KnowledgeLineageRepository } from "../../domain/KnowledgeLineageRepository.js";
import type { KnowledgeLineage } from "../../domain/KnowledgeLineage.js";
import type { LineageId } from "../../domain/LineageId.js";

export class InMemoryKnowledgeLineageRepository implements KnowledgeLineageRepository {
  private store = new Map<string, KnowledgeLineage>();

  async save(entity: KnowledgeLineage): Promise<void> {
    this.store.set(entity.id.value, entity);
  }

  async findById(id: LineageId): Promise<KnowledgeLineage | null> {
    return this.store.get(id.value) ?? null;
  }

  async delete(id: LineageId): Promise<void> {
    this.store.delete(id.value);
  }

  async findBySemanticUnitId(semanticUnitId: string): Promise<KnowledgeLineage | null> {
    for (const lineage of this.store.values()) {
      if (lineage.semanticUnitId === semanticUnitId) {
        return lineage;
      }
    }
    return null;
  }
}
