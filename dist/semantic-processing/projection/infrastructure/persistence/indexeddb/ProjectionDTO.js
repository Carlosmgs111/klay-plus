import { SemanticProjection } from "../../../domain/SemanticProjection.js";
import { ProjectionId } from "../../../domain/ProjectionId.js";
import { ProjectionResult } from "../../../domain/ProjectionResult.js";
export function toDTO(projection) {
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
export function fromDTO(dto) {
    const result = dto.result
        ? ProjectionResult.create(dto.result.type, dto.result.data, dto.result.strategyId, dto.result.strategyVersion)
        : null;
    return SemanticProjection.reconstitute(ProjectionId.create(dto.id), dto.semanticUnitId, dto.semanticUnitVersion, dto.type, dto.status, result, dto.error, new Date(dto.createdAt));
}
//# sourceMappingURL=ProjectionDTO.js.map