import { SemanticProjection } from "../../../domain/SemanticProjection";
import { ProjectionId } from "../../../domain/ProjectionId";
import { ProjectionResult } from "../../../domain/ProjectionResult";
import type { ProjectionType } from "../../../domain/ProjectionType";
import type { ProjectionStatus } from "../../../domain/ProjectionStatus";

export interface ProjectionDTO {
  id: string;
  sourceId: string;
  processingProfileId: string;
  type: string;
  status: string;
  result: {
    type: string;
    data: unknown;
    processingProfileId: string;
    processingProfileVersion: number;
    generatedAt: string;
  } | null;
  error: string | null;
  createdAt: string;
}

export function toDTO(projection: SemanticProjection): ProjectionDTO {
  return {
    id: projection.id.value,
    sourceId: projection.sourceId,
    processingProfileId: projection.processingProfileId,
    type: projection.type,
    status: projection.status,
    result: projection.result
      ? {
          type: projection.result.type,
          data: projection.result.data,
          processingProfileId: projection.result.processingProfileId,
          processingProfileVersion: projection.result.processingProfileVersion,
          generatedAt: projection.result.generatedAt.toISOString(),
        }
      : null,
    error: projection.error,
    createdAt: projection.createdAt.toISOString(),
  };
}

export function fromDTO(dto: ProjectionDTO): SemanticProjection {
  const result = dto.result
    ? ProjectionResult.create(
        dto.result.type as ProjectionType,
        dto.result.data,
        dto.result.processingProfileId,
        dto.result.processingProfileVersion,
      )
    : null;

  return SemanticProjection.reconstitute(
    ProjectionId.create(dto.id),
    dto.sourceId,
    dto.processingProfileId,
    dto.type as ProjectionType,
    dto.status as ProjectionStatus,
    result,
    dto.error,
    new Date(dto.createdAt),
  );
}
