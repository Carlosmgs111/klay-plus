import type { Repository } from "../../../../shared/domain";
import type { Resource } from "./Resource";
import type { ResourceId } from "./ResourceId";
import type { ResourceStatus } from "./ResourceStatus";

export interface ResourceRepository extends Repository<Resource, ResourceId> {
  findByStatus(status: ResourceStatus): Promise<Resource[]>;
  exists(id: ResourceId): Promise<boolean>;
}
