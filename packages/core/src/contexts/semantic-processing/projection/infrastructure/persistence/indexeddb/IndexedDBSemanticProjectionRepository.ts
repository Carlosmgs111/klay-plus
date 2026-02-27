import type { SemanticProjectionRepository } from "../../../domain/SemanticProjectionRepository.js";
import type { SemanticProjection } from "../../../domain/SemanticProjection.js";
import type { ProjectionType } from "../../../domain/ProjectionType.js";
import type { ProjectionStatus } from "../../../domain/ProjectionStatus.js";
import { BaseIndexedDBRepository } from "../../../../../../platform/persistence/BaseIndexedDBRepository.js";
import { toDTO, fromDTO, type ProjectionDTO } from "./ProjectionDTO.js";

export class IndexedDBSemanticProjectionRepository
  extends BaseIndexedDBRepository<SemanticProjection, ProjectionDTO>
  implements SemanticProjectionRepository
{
  constructor(dbName: string = "knowledge-platform") {
    super(dbName, "semantic-projections");
  }

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
    return this.deleteWhere(
      (d) => d.sourceId === sourceId,
      (d) => d.id,
    );
  }
}
