import type { ProcessingProfileRepository } from "../../domain/ProcessingProfileRepository";
import type { ProcessingProfile } from "../../domain/ProcessingProfile";
import type { ProcessingProfileId } from "../../domain/ProcessingProfileId";
import type { ProfileStatus } from "../../domain/ProfileStatus";
import { BaseInMemoryRepository } from "../../../../../platform/persistence/BaseInMemoryRepository";

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
