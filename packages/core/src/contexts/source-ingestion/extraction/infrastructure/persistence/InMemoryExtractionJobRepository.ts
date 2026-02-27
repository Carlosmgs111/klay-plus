import type { ExtractionJobRepository } from "../../domain/ExtractionJobRepository.js";
import type { ExtractionJob } from "../../domain/ExtractionJob.js";
import type { ExtractionStatus } from "../../domain/ExtractionStatus.js";
import { BaseInMemoryRepository } from "../../../../../platform/persistence/BaseInMemoryRepository.js";

export class InMemoryExtractionJobRepository
  extends BaseInMemoryRepository<ExtractionJob>
  implements ExtractionJobRepository
{
  async findBySourceId(sourceId: string): Promise<ExtractionJob[]> {
    return this.findWhere((j) => j.sourceId === sourceId);
  }

  async findByStatus(status: ExtractionStatus): Promise<ExtractionJob[]> {
    return this.findWhere((j) => j.status === status);
  }
}
