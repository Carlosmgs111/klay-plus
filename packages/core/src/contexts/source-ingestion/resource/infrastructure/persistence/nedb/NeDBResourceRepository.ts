import type { ResourceRepository } from "../../../domain/ResourceRepository.js";
import type { Resource } from "../../../domain/Resource.js";
import type { ResourceStatus } from "../../../domain/ResourceStatus.js";
import { BaseNeDBRepository } from "../../../../../../platform/persistence/BaseNeDBRepository.js";
import { toDTO, fromDTO, type ResourceDTO } from "../indexeddb/ResourceDTO.js";

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
