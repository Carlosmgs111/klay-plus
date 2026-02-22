import type { ResourceRepository } from "../../domain/ResourceRepository.js";
import type { Resource } from "../../domain/Resource.js";
import type { ResourceId } from "../../domain/ResourceId.js";
import type { ResourceStatus } from "../../domain/ResourceStatus.js";

export class InMemoryResourceRepository implements ResourceRepository {
  private store = new Map<string, Resource>();

  async save(entity: Resource): Promise<void> {
    this.store.set(entity.id.value, entity);
  }

  async findById(id: ResourceId): Promise<Resource | null> {
    return this.store.get(id.value) ?? null;
  }

  async delete(id: ResourceId): Promise<void> {
    this.store.delete(id.value);
  }

  async findByStatus(status: ResourceStatus): Promise<Resource[]> {
    return [...this.store.values()].filter((r) => r.status === status);
  }

  async exists(id: ResourceId): Promise<boolean> {
    return this.store.has(id.value);
  }
}
