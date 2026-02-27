import type { SemanticUnitRepository } from "../../../domain/SemanticUnitRepository.js";
import type { SemanticUnit } from "../../../domain/SemanticUnit.js";
import type { SemanticState } from "../../../domain/SemanticState.js";
import { BaseNeDBRepository } from "../../../../../../platform/persistence/BaseNeDBRepository.js";
import { toDTO, fromDTO, type SemanticUnitDTO } from "../indexeddb/SemanticUnitDTO.js";

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
