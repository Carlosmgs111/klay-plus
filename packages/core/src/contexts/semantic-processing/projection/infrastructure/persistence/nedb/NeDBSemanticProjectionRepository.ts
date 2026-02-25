import type { SemanticProjectionRepository } from "../../../domain/SemanticProjectionRepository.js";
import type { SemanticProjection } from "../../../domain/SemanticProjection.js";
import type { ProjectionId } from "../../../domain/ProjectionId.js";
import type { ProjectionType } from "../../../domain/ProjectionType.js";
import type { ProjectionStatus } from "../../../domain/ProjectionStatus.js";
import { NeDBStore } from "../../../../../../platform/persistence/nedb/NeDBStore.js";
import { toDTO, fromDTO, type ProjectionDTO } from "../indexeddb/ProjectionDTO.js";

export class NeDBSemanticProjectionRepository implements SemanticProjectionRepository {
  private store: NeDBStore<ProjectionDTO>;

  constructor(filename?: string) {
    this.store = new NeDBStore<ProjectionDTO>(filename);
  }

  async save(entity: SemanticProjection): Promise<void> {
    await this.store.put(entity.id.value, toDTO(entity));
  }

  async findById(id: ProjectionId): Promise<SemanticProjection | null> {
    const dto = await this.store.get(id.value);
    return dto ? fromDTO(dto) : null;
  }

  async delete(id: ProjectionId): Promise<void> {
    await this.store.remove(id.value);
  }

  async findBySemanticUnitId(semanticUnitId: string): Promise<SemanticProjection[]> {
    const results = await this.store.find((d) => d.semanticUnitId === semanticUnitId);
    return results.map(fromDTO);
  }

  async findBySemanticUnitIdAndType(
    semanticUnitId: string,
    type: ProjectionType,
  ): Promise<SemanticProjection | null> {
    const found = await this.store.findOne(
      (d) => d.semanticUnitId === semanticUnitId && d.type === type,
    );
    return found ? fromDTO(found) : null;
  }

  async findByStatus(status: ProjectionStatus): Promise<SemanticProjection[]> {
    const results = await this.store.find((d) => d.status === status);
    return results.map(fromDTO);
  }

  async findBySourceId(sourceId: string): Promise<SemanticProjection[]> {
    const results = await this.store.find((d) => d.sourceId === sourceId);
    return results.map(fromDTO);
  }

  async deleteBySourceId(sourceId: string): Promise<void> {
    const matching = await this.store.find((d) => d.sourceId === sourceId);
    for (const dto of matching) {
      await this.store.remove(dto.id);
    }
  }
}
