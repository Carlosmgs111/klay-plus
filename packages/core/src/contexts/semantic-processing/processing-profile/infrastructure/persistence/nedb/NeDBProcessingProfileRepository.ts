import type { ProcessingProfileRepository } from "../../../domain/ProcessingProfileRepository.js";
import type { ProcessingProfile } from "../../../domain/ProcessingProfile.js";
import type { ProcessingProfileId } from "../../../domain/ProcessingProfileId.js";
import type { ProfileStatus } from "../../../domain/ProfileStatus.js";
import { BaseNeDBRepository } from "../../../../../../platform/persistence/BaseNeDBRepository.js";
import { toDTO, fromDTO, type ProfileDTO } from "../indexeddb/ProfileDTO.js";

export class NeDBProcessingProfileRepository
  extends BaseNeDBRepository<ProcessingProfile, ProfileDTO>
  implements ProcessingProfileRepository
{
  protected toDTO = toDTO;
  protected fromDTO = fromDTO;

  async findByStatus(status: ProfileStatus): Promise<ProcessingProfile[]> {
    return this.findWhere((d) => d.status === status);
  }

  async findActiveById(id: ProcessingProfileId): Promise<ProcessingProfile | null> {
    return this.findOneWhere(
      (d) => d.id === id.value && d.status === "ACTIVE",
    );
  }
}
