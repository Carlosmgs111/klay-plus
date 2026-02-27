import type { SemanticUnitRepository } from "../../../domain/SemanticUnitRepository";
import type { SemanticUnit } from "../../../domain/SemanticUnit";
import type { SemanticState } from "../../../domain/SemanticState";
import { BaseIndexedDBRepository } from "../../../../../../platform/persistence/BaseIndexedDBRepository";
import { toDTO, fromDTO, type SemanticUnitDTO } from "./SemanticUnitDTO";

export class IndexedDBSemanticUnitRepository
  extends BaseIndexedDBRepository<SemanticUnit, SemanticUnitDTO>
  implements SemanticUnitRepository
{
  constructor(dbName: string = "knowledge-platform") {
    super(dbName, "semantic-units");
  }

  protected toDTO = toDTO;
  protected fromDTO = fromDTO;

  async findBySourceId(sourceId: string): Promise<SemanticUnit[]> {
    return this.findWhere(
      (d) =>
        d.sources?.some((s) => s.sourceId === sourceId) ??
        (d as any).origins?.some((o: any) => o.sourceId === sourceId) ??
        (d as any).origin?.sourceId === sourceId,
    );
  }

  async findByState(state: SemanticState): Promise<SemanticUnit[]> {
    return this.findWhere((d) => d.state === state);
  }

  async findByTags(tags: string[]): Promise<SemanticUnit[]> {
    const tagSet = new Set(tags);
    return this.findWhere((d) =>
      d.metadata.tags.some((t) => tagSet.has(t)),
    );
  }
}
