import type { ResourceRepository } from "../../../domain/ResourceRepository";
import type { Resource } from "../../../domain/Resource";
import type { ResourceStatus } from "../../../domain/ResourceStatus";
import { BaseNeDBRepository } from "../../../../../../platform/persistence/BaseNeDBRepository";
import { toDTO, fromDTO, type ResourceDTO } from "../indexeddb/ResourceDTO";

export class NeDBResourceRepository
  extends BaseNeDBRepository<Resource, ResourceDTO>
  implements ResourceRepository
{
  protected toDTO = toDTO;
  protected fromDTO = fromDTO;

  async findByStatus(status: ResourceStatus): Promise<Resource[]> {
    return this.findWhere((d) => d.status === status);
  }
}
