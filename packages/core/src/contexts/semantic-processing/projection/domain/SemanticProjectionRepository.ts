import type { Repository } from "../../../../shared/domain/index.js";
import type { SemanticProjection } from "./SemanticProjection.js";
import type { ProjectionId } from "./ProjectionId.js";
import type { ProjectionType } from "./ProjectionType.js";
import type { ProjectionStatus } from "./ProjectionStatus.js";

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
