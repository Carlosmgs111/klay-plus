import type { SemanticProjectionRepository } from "../../domain/SemanticProjectionRepository.js";
import type { SemanticProjection } from "../../domain/SemanticProjection.js";
import type { ProjectionId } from "../../domain/ProjectionId.js";
import type { ProjectionType } from "../../domain/ProjectionType.js";
import type { ProjectionStatus } from "../../domain/ProjectionStatus.js";
export declare class InMemorySemanticProjectionRepository implements SemanticProjectionRepository {
    private store;
    save(entity: SemanticProjection): Promise<void>;
    findById(id: ProjectionId): Promise<SemanticProjection | null>;
    delete(id: ProjectionId): Promise<void>;
    findBySemanticUnitId(semanticUnitId: string): Promise<SemanticProjection[]>;
    findBySemanticUnitIdAndType(semanticUnitId: string, type: ProjectionType): Promise<SemanticProjection | null>;
    findByStatus(status: ProjectionStatus): Promise<SemanticProjection[]>;
}
//# sourceMappingURL=InMemorySemanticProjectionRepository.d.ts.map