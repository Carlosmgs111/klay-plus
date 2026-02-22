import type { ProcessingProfileRepository } from "../../domain/ProcessingProfileRepository.js";
import type { ProcessingProfile } from "../../domain/ProcessingProfile.js";
import type { ProcessingProfileId } from "../../domain/ProcessingProfileId.js";
import type { ProfileStatus } from "../../domain/ProfileStatus.js";

export class InMemoryProcessingProfileRepository implements ProcessingProfileRepository {
  private store = new Map<string, ProcessingProfile>();

  async save(entity: ProcessingProfile): Promise<void> {
    this.store.set(entity.id.value, entity);
  }

  async findById(id: ProcessingProfileId): Promise<ProcessingProfile | null> {
    return this.store.get(id.value) ?? null;
  }

  async delete(id: ProcessingProfileId): Promise<void> {
    this.store.delete(id.value);
  }

  async findByStatus(status: ProfileStatus): Promise<ProcessingProfile[]> {
    return [...this.store.values()].filter((p) => p.status === status);
  }

  async findActiveById(id: ProcessingProfileId): Promise<ProcessingProfile | null> {
    const profile = this.store.get(id.value);
    if (profile && profile.isActive) return profile;
    return null;
  }
}
