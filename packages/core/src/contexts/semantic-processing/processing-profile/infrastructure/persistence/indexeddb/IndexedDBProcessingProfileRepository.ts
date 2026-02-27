import type { ProcessingProfileRepository } from "../../../domain/ProcessingProfileRepository.js";
import type { ProcessingProfile } from "../../../domain/ProcessingProfile.js";
import type { ProcessingProfileId } from "../../../domain/ProcessingProfileId.js";
import type { ProfileStatus } from "../../../domain/ProfileStatus.js";
import { BaseIndexedDBRepository } from "../../../../../../platform/persistence/BaseIndexedDBRepository.js";
import { toDTO, fromDTO, type ProfileDTO } from "./ProfileDTO.js";

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
