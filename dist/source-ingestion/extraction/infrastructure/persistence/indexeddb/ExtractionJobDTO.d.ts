import { ExtractionJob } from "../../../domain/ExtractionJob.js";
export interface ExtractionJobDTO {
    id: string;
    sourceId: string;
    status: string;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    error: string | null;
    extractedText: string | null;
    contentHash: string | null;
    metadata: Record<string, unknown> | null;
}
export declare function toDTO(job: ExtractionJob): ExtractionJobDTO;
export declare function fromDTO(dto: ExtractionJobDTO): ExtractionJob;
//# sourceMappingURL=ExtractionJobDTO.d.ts.map