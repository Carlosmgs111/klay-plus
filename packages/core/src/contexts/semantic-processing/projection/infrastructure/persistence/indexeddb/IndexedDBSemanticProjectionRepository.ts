import type { SemanticProjectionRepository } from "../../../domain/SemanticProjectionRepository";
import type { SemanticProjection } from "../../../domain/SemanticProjection";
import type { ProjectionStatus } from "../../../domain/ProjectionStatus";
import { BaseIndexedDBRepository } from "../../../../../../platform/persistence/BaseIndexedDBRepository";
import { toDTO, fromDTO, type ProjectionDTO } from "./ProjectionDTO";

export class IndexedDBSemanticProjectionRepository
  extends BaseIndexedDBRepository<SemanticProjection, ProjectionDTO>
  implements SemanticProjectionRepository
{
  constructor(dbName: string = "knowledge-platform") {
    super(dbName, "semantic-projections");
  }

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
    return this.deleteWhere(
      (d) => d.sourceId === sourceId,
      (d) => d.id,
    );
  }
}
