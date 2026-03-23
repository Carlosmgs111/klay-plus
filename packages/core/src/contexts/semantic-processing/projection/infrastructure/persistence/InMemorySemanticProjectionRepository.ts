import type { SemanticProjectionRepository } from "../../domain/SemanticProjectionRepository";
import type { SemanticProjection } from "../../domain/SemanticProjection";
import type { ProjectionStatus } from "../../domain/ProjectionStatus";
import { BaseInMemoryRepository } from "../../../../../shared/persistence/BaseInMemoryRepository";

export class InMemorySemanticProjectionRepository
  extends BaseInMemoryRepository<SemanticProjection>
  implements SemanticProjectionRepository
{
  async findBySourceId(sourceId: string): Promise<SemanticProjection[]> {
    return this.findWhere((p) => p.sourceId === sourceId);
  }

  async findBySourceIdAndProfileId(sourceId: string, profileId: string): Promise<SemanticProjection | null> {
    return this.findOneWhere(
      (p) => p.sourceId === sourceId && p.processingProfileId === profileId,
    );
  }

  async findByStatus(status: ProjectionStatus): Promise<SemanticProjection[]> {
    return this.findWhere((p) => p.status === status);
  }

  async deleteBySourceId(sourceId: string): Promise<void> {
    this.deleteWhere((p) => p.sourceId === sourceId);
  }
}
