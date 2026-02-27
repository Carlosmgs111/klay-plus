import type { Repository } from "../../../../shared/domain";
import type { SemanticProjection } from "./SemanticProjection";
import type { ProjectionId } from "./ProjectionId";
import type { ProjectionType } from "./ProjectionType";
import type { ProjectionStatus } from "./ProjectionStatus";

export interface SemanticProjectionRepository extends Repository<SemanticProjection, ProjectionId> {
  findBySemanticUnitId(semanticUnitId: string): Promise<SemanticProjection[]>;
  findBySemanticUnitIdAndType(
    semanticUnitId: string,
    type: ProjectionType,
  ): Promise<SemanticProjection | null>;
  findByStatus(status: ProjectionStatus): Promise<SemanticProjection[]>;
  findBySourceId(sourceId: string): Promise<SemanticProjection[]>;
  deleteBySourceId(sourceId: string): Promise<void>;
}
