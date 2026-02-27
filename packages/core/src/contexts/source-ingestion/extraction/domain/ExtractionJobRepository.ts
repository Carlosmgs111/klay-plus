import type { Repository } from "../../../../shared/domain";
import type { ExtractionJob } from "./ExtractionJob";
import type { ExtractionJobId } from "./ExtractionJobId";
import type { ExtractionStatus } from "./ExtractionStatus";

export interface ExtractionJobRepository extends Repository<ExtractionJob, ExtractionJobId> {
  findBySourceId(sourceId: string): Promise<ExtractionJob[]>;
  findByStatus(status: ExtractionStatus): Promise<ExtractionJob[]>;
}
