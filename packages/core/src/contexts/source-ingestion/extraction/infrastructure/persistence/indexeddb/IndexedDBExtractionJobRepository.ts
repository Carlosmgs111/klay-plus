import type { ExtractionJobRepository } from "../../../domain/ExtractionJobRepository";
import type { ExtractionJob } from "../../../domain/ExtractionJob";
import type { ExtractionStatus } from "../../../domain/ExtractionStatus";
import { BaseIndexedDBRepository } from "../../../../../../platform/persistence/BaseIndexedDBRepository";
import { toDTO, fromDTO, type ExtractionJobDTO } from "./ExtractionJobDTO";

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
