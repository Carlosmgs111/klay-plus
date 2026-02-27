import type { ResourceRepository } from "../../../domain/ResourceRepository";
import type { Resource } from "../../../domain/Resource";
import type { ResourceStatus } from "../../../domain/ResourceStatus";
import { BaseIndexedDBRepository } from "../../../../../../platform/persistence/BaseIndexedDBRepository";
import { toDTO, fromDTO, type ResourceDTO } from "./ResourceDTO";

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
