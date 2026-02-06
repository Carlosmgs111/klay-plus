import { SemanticProjection } from "../../../domain/SemanticProjection.js";
import { ProjectionId } from "../../../domain/ProjectionId.js";
import { ProjectionResult } from "../../../domain/ProjectionResult.js";
import type { ProjectionType } from "../../../domain/ProjectionType.js";
import type { ProjectionStatus } from "../../../domain/ProjectionStatus.js";

export interface ProjectionDTO {
  id: string;
  semanticUnitId: string;
  semanticUnitVersion: number;
  type: string;
  status: string;
  result: {
    type: string;
    data: unknown;
    strategyId: string;
    strategyVersion: number;
    generatedAt: string;
  } | null;
  error: string | null;
  createdAt: string;
}

export function toDTO(projection: SemanticProjection): ProjectionDTO {
  return {
    id: projection.id.value,
    semanticUnitId: projection.semanticUnitId,
    semanticUnitVersion: projection.semanticUnitVersion,
    type: projection.type,
    status: projection.status,
    result: projection.result
      ? {
          type: projection.result.type,
          data: projection.result.data,
          strategyId: projection.result.strategyId,
          strategyVersion: projection.result.strategyVersion,
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
        dto.result.strategyId,
        dto.result.strategyVersion,
      )
    : null;

  return SemanticProjection.reconstitute(
    ProjectionId.create(dto.id),
    dto.semanticUnitId,
    dto.semanticUnitVersion,
    dto.type as ProjectionType,
    dto.status as ProjectionStatus,
    result,
    dto.error,
    new Date(dto.createdAt),
  );
}
