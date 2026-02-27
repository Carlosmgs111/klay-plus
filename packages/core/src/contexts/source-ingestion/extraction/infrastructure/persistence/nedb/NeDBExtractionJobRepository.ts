import type { ExtractionJobRepository } from "../../../domain/ExtractionJobRepository";
import type { ExtractionJob } from "../../../domain/ExtractionJob";
import type { ExtractionStatus } from "../../../domain/ExtractionStatus";
import { BaseNeDBRepository } from "../../../../../../platform/persistence/BaseNeDBRepository";
import { toDTO, fromDTO, type ExtractionJobDTO } from "../indexeddb/ExtractionJobDTO";

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
