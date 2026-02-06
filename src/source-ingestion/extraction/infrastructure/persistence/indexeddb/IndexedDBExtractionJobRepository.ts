import type { ExtractionJobRepository } from "../../../domain/ExtractionJobRepository.js";
import type { ExtractionJob } from "../../../domain/ExtractionJob.js";
import type { ExtractionJobId } from "../../../domain/ExtractionJobId.js";
import type { ExtractionStatus } from "../../../domain/ExtractionStatus.js";
import { IndexedDBStore } from "../../../../../shared/infrastructure/indexeddb/IndexedDBStore.js";
import { toDTO, fromDTO, type ExtractionJobDTO } from "./ExtractionJobDTO.js";

export class IndexedDBExtractionJobRepository implements ExtractionJobRepository {
  private store: IndexedDBStore<ExtractionJobDTO>;

  constructor(dbName: string = "knowledge-platform") {
    this.store = new IndexedDBStore<ExtractionJobDTO>(dbName, "extraction-jobs");
  }

  async save(entity: ExtractionJob): Promise<void> {
    await this.store.put(entity.id.value, toDTO(entity));
  }

  async findById(id: ExtractionJobId): Promise<ExtractionJob | null> {
    const dto = await this.store.get(id.value);
    return dto ? fromDTO(dto) : null;
  }

  async delete(id: ExtractionJobId): Promise<void> {
    await this.store.remove(id.value);
  }

  async findBySourceId(sourceId: string): Promise<ExtractionJob[]> {
    const all = await this.store.getAll();
    return all.filter((d) => d.sourceId === sourceId).map(fromDTO);
  }

  async findByStatus(status: ExtractionStatus): Promise<ExtractionJob[]> {
    const all = await this.store.getAll();
    return all.filter((d) => d.status === status).map(fromDTO);
  }
}
