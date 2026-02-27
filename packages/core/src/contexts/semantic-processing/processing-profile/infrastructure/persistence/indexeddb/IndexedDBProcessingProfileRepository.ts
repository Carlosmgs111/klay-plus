import type { ProcessingProfileRepository } from "../../../domain/ProcessingProfileRepository";
import type { ProcessingProfile } from "../../../domain/ProcessingProfile";
import type { ProcessingProfileId } from "../../../domain/ProcessingProfileId";
import type { ProfileStatus } from "../../../domain/ProfileStatus";
import { BaseIndexedDBRepository } from "../../../../../../platform/persistence/BaseIndexedDBRepository";
import { toDTO, fromDTO, type ProfileDTO } from "./ProfileDTO";

export class IndexedDBProcessingProfileRepository
  extends BaseIndexedDBRepository<ProcessingProfile, ProfileDTO>
  implements ProcessingProfileRepository
{
  constructor(dbName: string = "knowledge-platform") {
    super(dbName, "processing-profiles");
  }

  protected toDTO = toDTO;
  protected fromDTO = fromDTO;

  async findByStatus(status: ProfileStatus): Promise<ProcessingProfile[]> {
    return this.findWhere((d) => d.status === status);
  }

  async findActiveById(id: ProcessingProfileId): Promise<ProcessingProfile | null> {
    const dto = await this.store.get(id.value);
    if (dto && dto.status === "ACTIVE") return this.fromDTO(dto);
    return null;
  }
}
