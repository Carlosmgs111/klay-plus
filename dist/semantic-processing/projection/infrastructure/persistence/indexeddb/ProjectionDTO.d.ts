import { SemanticProjection } from "../../../domain/SemanticProjection.js";
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
export declare function toDTO(projection: SemanticProjection): ProjectionDTO;
export declare function fromDTO(dto: ProjectionDTO): SemanticProjection;
//# sourceMappingURL=ProjectionDTO.d.ts.map