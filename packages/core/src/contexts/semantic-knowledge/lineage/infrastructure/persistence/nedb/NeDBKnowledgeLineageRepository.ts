import type { KnowledgeLineageRepository } from "../../../domain/KnowledgeLineageRepository.js";
import type { KnowledgeLineage } from "../../../domain/KnowledgeLineage.js";
import { BaseNeDBRepository } from "../../../../../../platform/persistence/BaseNeDBRepository.js";
import { toDTO, fromDTO, type LineageDTO } from "../indexeddb/LineageDTO.js";

export class NeDBKnowledgeLineageRepository
  extends BaseNeDBRepository<KnowledgeLineage, LineageDTO>
  implements KnowledgeLineageRepository
{
  protected toDTO = toDTO;
  protected fromDTO = fromDTO;

  async findBySemanticUnitId(semanticUnitId: string): Promise<KnowledgeLineage | null> {
    return this.findOneWhere((d) => d.semanticUnitId === semanticUnitId);
  }

  async findByTraceTargetUnitId(targetUnitId: string): Promise<KnowledgeLineage[]> {
    return this.findWhere((d) =>
      d.traces.some((t) => t.toUnitId === targetUnitId),
    );
  }
}
