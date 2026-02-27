import type { ExtractionJobRepository } from "../../../domain/ExtractionJobRepository.js";
import type { ExtractionJob } from "../../../domain/ExtractionJob.js";
import type { ExtractionStatus } from "../../../domain/ExtractionStatus.js";
import { BaseNeDBRepository } from "../../../../../../platform/persistence/BaseNeDBRepository.js";
import { toDTO, fromDTO, type ExtractionJobDTO } from "../indexeddb/ExtractionJobDTO.js";

export class NeDBExtractionJobRepository
  extends BaseNeDBRepository<ExtractionJob, ExtractionJobDTO>
  implements ExtractionJobRepository
{
  protected toDTO = toDTO;
  protected fromDTO = fromDTO;

  async findBySourceId(sourceId: string): Promise<ExtractionJob[]> {
    return this.findWhere((d) => d.sourceId === sourceId);
  }

  async findByStatus(status: ExtractionStatus): Promise<ExtractionJob[]> {
    return this.findWhere((d) => d.status === status);
  }
}
