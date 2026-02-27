import type { Repository } from "../../../../shared/domain";
import type { ProcessingProfile } from "./ProcessingProfile";
import type { ProcessingProfileId } from "./ProcessingProfileId";
import type { ProfileStatus } from "./ProfileStatus";

export interface ProcessingProfileRepository
  extends Repository<ProcessingProfile, ProcessingProfileId> {
  findByStatus(status: ProfileStatus): Promise<ProcessingProfile[]>;
  findActiveById(id: ProcessingProfileId): Promise<ProcessingProfile | null>;
}
