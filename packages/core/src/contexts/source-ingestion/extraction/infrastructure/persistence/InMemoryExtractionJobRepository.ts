import type { ExtractionJobRepository } from "../../domain/ExtractionJobRepository";
import type { ExtractionJob } from "../../domain/ExtractionJob";
import type { ExtractionStatus } from "../../domain/ExtractionStatus";
import { BaseInMemoryRepository } from "../../../../../platform/persistence/BaseInMemoryRepository";

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
