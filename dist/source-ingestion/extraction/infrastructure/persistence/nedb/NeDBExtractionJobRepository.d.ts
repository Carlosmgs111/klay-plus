import type { ExtractionJobRepository } from "../../../domain/ExtractionJobRepository.js";
import type { ExtractionJob } from "../../../domain/ExtractionJob.js";
import type { ExtractionJobId } from "../../../domain/ExtractionJobId.js";
import type { ExtractionStatus } from "../../../domain/ExtractionStatus.js";
export declare class NeDBExtractionJobRepository implements ExtractionJobRepository {
    private store;
    constructor(filename?: string);
    save(entity: ExtractionJob): Promise<void>;
    findById(id: ExtractionJobId): Promise<ExtractionJob | null>;
    delete(id: ExtractionJobId): Promise<void>;
    findBySourceId(sourceId: string): Promise<ExtractionJob[]>;
    findByStatus(status: ExtractionStatus): Promise<ExtractionJob[]>;
}
//# sourceMappingURL=NeDBExtractionJobRepository.d.ts.map