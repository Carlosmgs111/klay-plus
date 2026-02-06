import type { ExtractionJobRepository } from "../../domain/ExtractionJobRepository.js";
import type { ExtractionJob } from "../../domain/ExtractionJob.js";
import type { ExtractionJobId } from "../../domain/ExtractionJobId.js";
import type { ExtractionStatus } from "../../domain/ExtractionStatus.js";

export class InMemoryExtractionJobRepository implements ExtractionJobRepository {
  private store = new Map<string, ExtractionJob>();

  async save(entity: ExtractionJob): Promise<void> {
    this.store.set(entity.id.value, entity);
  }

  async findById(id: ExtractionJobId): Promise<ExtractionJob | null> {
    return this.store.get(id.value) ?? null;
  }

  async delete(id: ExtractionJobId): Promise<void> {
    this.store.delete(id.value);
  }

  async findBySourceId(sourceId: string): Promise<ExtractionJob[]> {
    return [...this.store.values()].filter((j) => j.sourceId === sourceId);
  }

  async findByStatus(status: ExtractionStatus): Promise<ExtractionJob[]> {
    return [...this.store.values()].filter((j) => j.status === status);
  }
}
