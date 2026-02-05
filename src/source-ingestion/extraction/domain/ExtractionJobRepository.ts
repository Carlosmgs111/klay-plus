import type { Repository } from "../../../shared/domain/index.js";
import type { ExtractionJob } from "./ExtractionJob.js";
import type { ExtractionJobId } from "./ExtractionJobId.js";
import type { ExtractionStatus } from "./ExtractionStatus.js";

export interface ExtractionJobRepository extends Repository<ExtractionJob, ExtractionJobId> {
  findBySourceId(sourceId: string): Promise<ExtractionJob[]>;
  findByStatus(status: ExtractionStatus): Promise<ExtractionJob[]>;
}
