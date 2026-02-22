import type { Repository } from "../../../../shared/domain/index.js";
import type { Resource } from "./Resource.js";
import type { ResourceId } from "./ResourceId.js";
import type { ResourceStatus } from "./ResourceStatus.js";

export interface ResourceRepository extends Repository<Resource, ResourceId> {
  findByStatus(status: ResourceStatus): Promise<Resource[]>;
  exists(id: ResourceId): Promise<boolean>;
}
