import type { SemanticProjectionRepository } from "../../../domain/SemanticProjectionRepository";
import type { SemanticProjection } from "../../../domain/SemanticProjection";
import type { ProjectionStatus } from "../../../domain/ProjectionStatus";
import { BaseNeDBRepository } from "../../../../../../platform/persistence/BaseNeDBRepository";
import { toDTO, fromDTO, type ProjectionDTO } from "../indexeddb/ProjectionDTO";

export class NeDBSemanticProjectionRepository
  extends BaseNeDBRepository<SemanticProjection, ProjectionDTO>
  implements SemanticProjectionRepository
{
  protected toDTO = toDTO;
  protected fromDTO = fromDTO;

  async findBySourceId(sourceId: string): Promise<SemanticProjection[]> {
    return this.findWhere((d) => d.sourceId === sourceId);
  }

  async findBySourceIdAndProfileId(sourceId: string, profileId: string): Promise<SemanticProjection | null> {
    return this.findOneWhere(
      (d) => d.sourceId === sourceId && d.processingProfileId === profileId,
    );
  }

  async findByStatus(status: ProjectionStatus): Promise<SemanticProjection[]> {
    return this.findWhere((d) => d.status === status);
  }

  async deleteBySourceId(sourceId: string): Promise<void> {
    const matching = await this.store.find((d) => d.sourceId === sourceId);
    for (const dto of matching) {
      await this.store.remove(dto.id);
    }
  }
}
