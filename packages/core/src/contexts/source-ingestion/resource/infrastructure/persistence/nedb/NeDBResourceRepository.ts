import type { ResourceRepository } from "../../../domain/ResourceRepository.js";
import type { Resource } from "../../../domain/Resource.js";
import type { ResourceId } from "../../../domain/ResourceId.js";
import type { ResourceStatus } from "../../../domain/ResourceStatus.js";
import { NeDBStore } from "../../../../../../platform/persistence/nedb/NeDBStore";
import { toDTO, fromDTO, type ResourceDTO } from "../indexeddb/ResourceDTO.js";

export class NeDBResourceRepository implements ResourceRepository {
  private store: NeDBStore<ResourceDTO>;

  constructor(filename?: string) {
    this.store = new NeDBStore<ResourceDTO>(filename);
  }

  async save(entity: Resource): Promise<void> {
    await this.store.put(entity.id.value, toDTO(entity));
  }

  async findById(id: ResourceId): Promise<Resource | null> {
    const dto = await this.store.get(id.value);
    return dto ? fromDTO(dto) : null;
  }

  async delete(id: ResourceId): Promise<void> {
    await this.store.remove(id.value);
  }

  async findByStatus(status: ResourceStatus): Promise<Resource[]> {
    const results = await this.store.find((d) => d.status === status);
    return results.map(fromDTO);
  }

  async exists(id: ResourceId): Promise<boolean> {
    return this.store.has(id.value);
  }
}
