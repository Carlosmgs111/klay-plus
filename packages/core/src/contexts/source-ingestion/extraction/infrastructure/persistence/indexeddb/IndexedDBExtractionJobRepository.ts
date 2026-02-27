import type { ExtractionJobRepository } from "../../../domain/ExtractionJobRepository.js";
import type { ExtractionJob } from "../../../domain/ExtractionJob.js";
import type { ExtractionStatus } from "../../../domain/ExtractionStatus.js";
import { BaseIndexedDBRepository } from "../../../../../../platform/persistence/BaseIndexedDBRepository.js";
import { toDTO, fromDTO, type ExtractionJobDTO } from "./ExtractionJobDTO.js";

export class IndexedDBExtractionJobRepository
  extends BaseIndexedDBRepository<ExtractionJob, ExtractionJobDTO>
  implements ExtractionJobRepository
{
  constructor(dbName: string = "knowledge-platform") {
    super(dbName, "extraction-jobs");
  }

  protected toDTO = toDTO;
  protected fromDTO = fromDTO;

  async findBySourceId(sourceId: string): Promise<ExtractionJob[]> {
    return this.findWhere((d) => d.sourceId === sourceId);
  }

  async findByStatus(status: ExtractionStatus): Promise<ExtractionJob[]> {
    return this.findWhere((d) => d.status === status);
  }
}
