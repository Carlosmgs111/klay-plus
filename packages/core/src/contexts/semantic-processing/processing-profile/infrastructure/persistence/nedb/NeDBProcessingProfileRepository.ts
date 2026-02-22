import type { ProcessingProfileRepository } from "../../../domain/ProcessingProfileRepository.js";
import type { ProcessingProfile } from "../../../domain/ProcessingProfile.js";
import type { ProcessingProfileId } from "../../../domain/ProcessingProfileId.js";
import type { ProfileStatus } from "../../../domain/ProfileStatus.js";
import { NeDBStore } from "../../../../../../platform/persistence/nedb/NeDBStore.js";
import { toDTO, fromDTO, type ProfileDTO } from "../indexeddb/ProfileDTO.js";

export class NeDBProcessingProfileRepository implements ProcessingProfileRepository {
  private store: NeDBStore<ProfileDTO>;

  constructor(filename?: string) {
    this.store = new NeDBStore<ProfileDTO>(filename);
  }

  async save(entity: ProcessingProfile): Promise<void> {
    await this.store.put(entity.id.value, toDTO(entity));
  }

  async findById(id: ProcessingProfileId): Promise<ProcessingProfile | null> {
    const dto = await this.store.get(id.value);
    return dto ? fromDTO(dto) : null;
  }

  async delete(id: ProcessingProfileId): Promise<void> {
    await this.store.remove(id.value);
  }

  async findByStatus(status: ProfileStatus): Promise<ProcessingProfile[]> {
    const results = await this.store.find((d) => d.status === status);
    return results.map(fromDTO);
  }

  async findActiveById(id: ProcessingProfileId): Promise<ProcessingProfile | null> {
    const dto = await this.store.findOne(
      (d) => d.id === id.value && d.status === "ACTIVE",
    );
    return dto ? fromDTO(dto) : null;
  }
}
