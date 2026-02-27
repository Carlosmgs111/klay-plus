import type { ResourceRepository } from "../../domain/ResourceRepository.js";
import type { Resource } from "../../domain/Resource.js";
import type { ResourceStatus } from "../../domain/ResourceStatus.js";
import { BaseInMemoryRepository } from "../../../../../platform/persistence/BaseInMemoryRepository.js";

export class InMemoryResourceRepository
  extends BaseInMemoryRepository<Resource>
  implements ResourceRepository
{
  async findByStatus(status: ResourceStatus): Promise<Resource[]> {
    return this.findWhere((r) => r.status === status);
  }
}
