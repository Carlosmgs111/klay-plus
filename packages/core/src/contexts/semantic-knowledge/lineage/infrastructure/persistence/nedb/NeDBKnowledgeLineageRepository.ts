import type { KnowledgeLineageRepository } from "../../../domain/KnowledgeLineageRepository";
import type { KnowledgeLineage } from "../../../domain/KnowledgeLineage";
import { BaseNeDBRepository } from "../../../../../../platform/persistence/BaseNeDBRepository";
import { toDTO, fromDTO, type LineageDTO } from "../indexeddb/LineageDTO";

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
