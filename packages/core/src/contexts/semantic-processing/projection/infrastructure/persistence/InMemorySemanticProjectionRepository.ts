import type { SemanticProjectionRepository } from "../../domain/SemanticProjectionRepository.js";
import type { SemanticProjection } from "../../domain/SemanticProjection.js";
import type { ProjectionType } from "../../domain/ProjectionType.js";
import type { ProjectionStatus } from "../../domain/ProjectionStatus.js";
import { BaseInMemoryRepository } from "../../../../../platform/persistence/BaseInMemoryRepository.js";

export class InMemorySemanticProjectionRepository
  extends BaseInMemoryRepository<SemanticProjection>
  implements SemanticProjectionRepository
{
  async findBySemanticUnitId(semanticUnitId: string): Promise<SemanticProjection[]> {
    return this.findWhere((p) => p.semanticUnitId === semanticUnitId);
  }

  async findBySemanticUnitIdAndType(
    semanticUnitId: string,
    type: ProjectionType,
  ): Promise<SemanticProjection | null> {
    return this.findOneWhere(
      (p) => p.semanticUnitId === semanticUnitId && p.type === type,
    );
  }

  async findByStatus(status: ProjectionStatus): Promise<SemanticProjection[]> {
    return this.findWhere((p) => p.status === status);
  }

  async findBySourceId(sourceId: string): Promise<SemanticProjection[]> {
    return this.findWhere((p) => p.sourceId === sourceId);
  }

  async deleteBySourceId(sourceId: string): Promise<void> {
    this.deleteWhere((p) => p.sourceId === sourceId);
  }
}
