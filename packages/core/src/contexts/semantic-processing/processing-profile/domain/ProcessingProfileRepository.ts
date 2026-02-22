import type { Repository } from "../../../../shared/domain/index";
import type { ProcessingProfile } from "./ProcessingProfile.js";
import type { ProcessingProfileId } from "./ProcessingProfileId.js";
import type { ProfileStatus } from "./ProfileStatus.js";

export interface ProcessingProfileRepository
  extends Repository<ProcessingProfile, ProcessingProfileId> {
  findByStatus(status: ProfileStatus): Promise<ProcessingProfile[]>;
  findActiveById(id: ProcessingProfileId): Promise<ProcessingProfile | null>;
}
