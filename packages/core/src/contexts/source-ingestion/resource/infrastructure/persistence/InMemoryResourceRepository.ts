import type { ResourceRepository } from "../../domain/ResourceRepository";
import type { Resource } from "../../domain/Resource";
import type { ResourceStatus } from "../../domain/ResourceStatus";
import { BaseInMemoryRepository } from "../../../../../platform/persistence/BaseInMemoryRepository";

export class InMemoryResourceRepository
  extends BaseInMemoryRepository<Resource>
  implements ResourceRepository
{
  async findByStatus(status: ResourceStatus): Promise<Resource[]> {
    return this.findWhere((r) => r.status === status);
  }
}
