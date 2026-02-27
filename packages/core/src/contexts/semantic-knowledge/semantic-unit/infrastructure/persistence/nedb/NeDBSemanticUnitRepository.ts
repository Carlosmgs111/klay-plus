import type { SemanticUnitRepository } from "../../../domain/SemanticUnitRepository";
import type { SemanticUnit } from "../../../domain/SemanticUnit";
import type { SemanticState } from "../../../domain/SemanticState";
import { BaseNeDBRepository } from "../../../../../../platform/persistence/BaseNeDBRepository";
import { toDTO, fromDTO, type SemanticUnitDTO } from "../indexeddb/SemanticUnitDTO";

export class NeDBSemanticUnitRepository
  extends BaseNeDBRepository<SemanticUnit, SemanticUnitDTO>
  implements SemanticUnitRepository
{
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
