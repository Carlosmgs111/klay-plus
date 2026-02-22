import type { ProcessingProfileRepository } from "../../../domain/ProcessingProfileRepository.js";
import type { ProcessingProfile } from "../../../domain/ProcessingProfile.js";
import type { ProcessingProfileId } from "../../../domain/ProcessingProfileId.js";
import type { ProfileStatus } from "../../../domain/ProfileStatus.js";
import { IndexedDBStore } from "../../../../../../platform/persistence/indexeddb/IndexedDBStore";
import { toDTO, fromDTO, type ProfileDTO } from "./ProfileDTO.js";

export class IndexedDBProcessingProfileRepository implements ProcessingProfileRepository {
  private store: IndexedDBStore<ProfileDTO>;

  constructor(dbName: string) {
    this.store = new IndexedDBStore<ProfileDTO>(dbName, "processing-profiles");
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
    const all = await this.store.getAll();
    return all.filter((d) => d.status === status).map(fromDTO);
  }

  async findActiveById(id: ProcessingProfileId): Promise<ProcessingProfile | null> {
    const dto = await this.store.get(id.value);
    if (dto && dto.status === "ACTIVE") return fromDTO(dto);
    return null;
  }
}
