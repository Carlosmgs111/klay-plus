import type { ResourceRepository } from "../../../domain/ResourceRepository.js";
import type { Resource } from "../../../domain/Resource.js";
import type { ResourceId } from "../../../domain/ResourceId.js";
import type { ResourceStatus } from "../../../domain/ResourceStatus.js";
import { IndexedDBStore } from "../../../../../../platform/persistence/indexeddb/IndexedDBStore.js";
import { toDTO, fromDTO, type ResourceDTO } from "./ResourceDTO.js";

export class IndexedDBResourceRepository implements ResourceRepository {
  private store: IndexedDBStore<ResourceDTO>;

  constructor(dbName: string = "knowledge-platform") {
    this.store = new IndexedDBStore<ResourceDTO>(dbName, "resources");
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
    const all = await this.store.getAll();
    return all.filter((d) => d.status === status).map(fromDTO);
  }

  async exists(id: ResourceId): Promise<boolean> {
    return this.store.has(id.value);
  }
}
