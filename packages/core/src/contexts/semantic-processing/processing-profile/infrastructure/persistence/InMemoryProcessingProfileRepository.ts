import type { ProcessingProfileRepository } from "../../domain/ProcessingProfileRepository.js";
import type { ProcessingProfile } from "../../domain/ProcessingProfile.js";
import type { ProcessingProfileId } from "../../domain/ProcessingProfileId.js";
import type { ProfileStatus } from "../../domain/ProfileStatus.js";
import { BaseInMemoryRepository } from "../../../../../platform/persistence/BaseInMemoryRepository.js";

export class InMemoryProcessingProfileRepository
  extends BaseInMemoryRepository<ProcessingProfile>
  implements ProcessingProfileRepository
{
  async findByStatus(status: ProfileStatus): Promise<ProcessingProfile[]> {
    return this.findWhere((p) => p.status === status);
  }

  async findActiveById(id: ProcessingProfileId): Promise<ProcessingProfile | null> {
    const profile = await this.findById(id);
    if (profile && profile.isActive) return profile;
    return null;
  }
}
