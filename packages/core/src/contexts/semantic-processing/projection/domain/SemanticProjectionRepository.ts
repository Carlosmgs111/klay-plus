import type { Repository } from "../../../../shared/domain";
import type { SemanticProjection } from "./SemanticProjection";
import type { ProjectionId } from "./ProjectionId";
import type { ProjectionStatus } from "./ProjectionStatus";

export interface SemanticProjectionRepository extends Repository<SemanticProjection, ProjectionId> {
  findBySourceId(sourceId: string): Promise<SemanticProjection[]>;
  findBySourceIdAndProfileId(sourceId: string, profileId: string): Promise<SemanticProjection | null>;
  findByStatus(status: ProjectionStatus): Promise<SemanticProjection[]>;
  deleteBySourceId(sourceId: string): Promise<void>;
}
