import type { SemanticProjectionRepository } from "../../../domain/SemanticProjectionRepository.js";
import type { SemanticProjection } from "../../../domain/SemanticProjection.js";
import type { ProjectionId } from "../../../domain/ProjectionId.js";
import type { ProjectionType } from "../../../domain/ProjectionType.js";
import type { ProjectionStatus } from "../../../domain/ProjectionStatus.js";
import { IndexedDBStore } from "../../../../../shared/infrastructure/indexeddb/IndexedDBStore.js";
import { toDTO, fromDTO, type ProjectionDTO } from "./ProjectionDTO.js";

export class IndexedDBSemanticProjectionRepository implements SemanticProjectionRepository {
  private store: IndexedDBStore<ProjectionDTO>;

  constructor(dbName: string = "knowledge-platform") {
    this.store = new IndexedDBStore<ProjectionDTO>(dbName, "semantic-projections");
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
    const all = await this.store.getAll();
    return all.filter((d) => d.semanticUnitId === semanticUnitId).map(fromDTO);
  }

  async findBySemanticUnitIdAndType(
    semanticUnitId: string,
    type: ProjectionType,
  ): Promise<SemanticProjection | null> {
    const all = await this.store.getAll();
    const found = all.find(
      (d) => d.semanticUnitId === semanticUnitId && d.type === type,
    );
    return found ? fromDTO(found) : null;
  }

  async findByStatus(status: ProjectionStatus): Promise<SemanticProjection[]> {
    const all = await this.store.getAll();
    return all.filter((d) => d.status === status).map(fromDTO);
  }
}
