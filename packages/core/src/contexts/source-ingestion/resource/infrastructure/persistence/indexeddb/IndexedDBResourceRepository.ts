import type { ResourceRepository } from "../../../domain/ResourceRepository.js";
import type { Resource } from "../../../domain/Resource.js";
import type { ResourceStatus } from "../../../domain/ResourceStatus.js";
import { BaseIndexedDBRepository } from "../../../../../../platform/persistence/BaseIndexedDBRepository.js";
import { toDTO, fromDTO, type ResourceDTO } from "./ResourceDTO.js";

export class IndexedDBResourceRepository
  extends BaseIndexedDBRepository<Resource, ResourceDTO>
  implements ResourceRepository
{
  constructor(dbName: string = "knowledge-platform") {
    super(dbName, "resources");
  }

  protected toDTO = toDTO;
  protected fromDTO = fromDTO;

  async findByStatus(status: ResourceStatus): Promise<Resource[]> {
    return this.findWhere((d) => d.status === status);
  }
}
