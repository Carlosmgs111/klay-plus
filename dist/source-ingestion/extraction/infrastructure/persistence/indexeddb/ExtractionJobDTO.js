import { ExtractionJob } from "../../../domain/ExtractionJob.js";
import { ExtractionJobId } from "../../../domain/ExtractionJobId.js";
export function toDTO(job) {
    return {
        id: job.id.value,
        sourceId: job.sourceId,
        status: job.status,
        createdAt: job.createdAt.toISOString(),
        startedAt: job.startedAt?.toISOString() ?? null,
        completedAt: job.completedAt?.toISOString() ?? null,
        error: job.error,
        extractedText: job.extractedText,
        contentHash: job.contentHash,
        metadata: job.metadata,
    };
}
export function fromDTO(dto) {
    return ExtractionJob.reconstitute(ExtractionJobId.create(dto.id), dto.sourceId, dto.status, new Date(dto.createdAt), dto.startedAt ? new Date(dto.startedAt) : null, dto.completedAt ? new Date(dto.completedAt) : null, dto.error, dto.extractedText, dto.contentHash, dto.metadata);
}
//# sourceMappingURL=ExtractionJobDTO.js.map