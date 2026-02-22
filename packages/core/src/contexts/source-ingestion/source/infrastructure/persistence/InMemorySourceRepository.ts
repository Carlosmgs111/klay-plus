import type { SourceRepository } from "../../domain/SourceRepository.js";
import type { Source } from "../../domain/Source.js";
import type { SourceId } from "../../domain/SourceId.js";
import type { SourceType } from "../../domain/SourceType.js";

export class InMemorySourceRepository implements SourceRepository {
  private store = new Map<string, Source>();

  async save(entity: Source): Promise<void> {
    this.store.set(entity.id.value, entity);
  }

  async findById(id: SourceId): Promise<Source | null> {
    return this.store.get(id.value) ?? null;
  }

  async delete(id: SourceId): Promise<void> {
    this.store.delete(id.value);
  }

  async findByType(type: SourceType): Promise<Source[]> {
    return [...this.store.values()].filter((s) => s.type === type);
  }

  async findByUri(uri: string): Promise<Source | null> {
    for (const source of this.store.values()) {
      if (source.uri === uri) return source;
    }
    return null;
  }

  async exists(id: SourceId): Promise<boolean> {
    return this.store.has(id.value);
  }
}
