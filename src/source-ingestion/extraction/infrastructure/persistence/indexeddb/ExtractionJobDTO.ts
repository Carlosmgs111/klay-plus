import { ExtractionJob } from "../../../domain/ExtractionJob.js";
import { ExtractionJobId } from "../../../domain/ExtractionJobId.js";
import type { ExtractionStatus } from "../../../domain/ExtractionStatus.js";

export interface ExtractionJobDTO {
  id: string;
  sourceId: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

export function toDTO(job: ExtractionJob): ExtractionJobDTO {
  return {
    id: job.id.value,
    sourceId: job.sourceId,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    error: job.error,
  };
}

export function fromDTO(dto: ExtractionJobDTO): ExtractionJob {
  return ExtractionJob.reconstitute(
    ExtractionJobId.create(dto.id),
    dto.sourceId,
    dto.status as ExtractionStatus,
    new Date(dto.createdAt),
    dto.startedAt ? new Date(dto.startedAt) : null,
    dto.completedAt ? new Date(dto.completedAt) : null,
    dto.error,
  );
}
