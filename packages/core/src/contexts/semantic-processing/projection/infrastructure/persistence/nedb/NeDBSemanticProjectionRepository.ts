import type { SemanticProjectionRepository } from "../../../domain/SemanticProjectionRepository";
import type { SemanticProjection } from "../../../domain/SemanticProjection";
import type { ProjectionType } from "../../../domain/ProjectionType";
import type { ProjectionStatus } from "../../../domain/ProjectionStatus";
import { BaseNeDBRepository } from "../../../../../../platform/persistence/BaseNeDBRepository";
import { toDTO, fromDTO, type ProjectionDTO } from "../indexeddb/ProjectionDTO";

export class NeDBSemanticProjectionRepository
  extends BaseNeDBRepository<SemanticProjection, ProjectionDTO>
  implements SemanticProjectionRepository
{
  protected toDTO = toDTO;
  protected fromDTO = fromDTO;

  async findBySemanticUnitId(semanticUnitId: string): Promise<SemanticProjection[]> {
    return this.findWhere((d) => d.semanticUnitId === semanticUnitId);
  }

  async findBySemanticUnitIdAndType(
    semanticUnitId: string,
    type: ProjectionType,
  ): Promise<SemanticProjection | null> {
    return this.findOneWhere(
      (d) => d.semanticUnitId === semanticUnitId && d.type === type,
    );
  }

  async findByStatus(status: ProjectionStatus): Promise<SemanticProjection[]> {
    return this.findWhere((d) => d.status === status);
  }

  async findBySourceId(sourceId: string): Promise<SemanticProjection[]> {
    return this.findWhere((d) => d.sourceId === sourceId);
  }

  async deleteBySourceId(sourceId: string): Promise<void> {
    const matching = await this.store.find((d) => d.sourceId === sourceId);
    for (const dto of matching) {
      await this.store.remove(dto.id);
    }
  }
}
