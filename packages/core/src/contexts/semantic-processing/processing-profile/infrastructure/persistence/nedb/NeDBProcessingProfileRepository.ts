import type { ProcessingProfileRepository } from "../../../domain/ProcessingProfileRepository";
import type { ProcessingProfile } from "../../../domain/ProcessingProfile";
import type { ProcessingProfileId } from "../../../domain/ProcessingProfileId";
import type { ProfileStatus } from "../../../domain/ProfileStatus";
import { BaseNeDBRepository } from "../../../../../../shared/persistence/BaseNeDBRepository";
import { toDTO, fromDTO, type ProfileDTO } from "../indexeddb/ProfileDTO";

export class NeDBProcessingProfileRepository
  extends BaseNeDBRepository<ProcessingProfile, ProfileDTO>
  implements ProcessingProfileRepository
{
  protected toDTO = toDTO;
  protected fromDTO = fromDTO;

  async findAll(): Promise<ProcessingProfile[]> {
    const all = await this.store.getAll();
    return all.map((dto) => this.fromDTO(dto));
  }

  async findByStatus(status: ProfileStatus): Promise<ProcessingProfile[]> {
    return this.findWhere((d) => d.status === status);
  }

  async findActiveById(id: ProcessingProfileId): Promise<ProcessingProfile | null> {
    return this.findOneWhere(
      (d) => d.id === id.value && d.status === "ACTIVE",
    );
  }
}
