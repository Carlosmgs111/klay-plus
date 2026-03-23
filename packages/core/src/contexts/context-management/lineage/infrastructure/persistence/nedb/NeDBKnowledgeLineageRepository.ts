import type { KnowledgeLineageRepository } from "../../../domain/KnowledgeLineageRepository";
import type { KnowledgeLineage } from "../../../domain/KnowledgeLineage";
import { BaseNeDBRepository } from "../../../../../../shared/persistence/BaseNeDBRepository";
import { toDTO, fromDTO, type LineageDTO } from "../indexeddb/LineageDTO";

export class NeDBKnowledgeLineageRepository
  extends BaseNeDBRepository<KnowledgeLineage, LineageDTO>
  implements KnowledgeLineageRepository
{
  protected toDTO = toDTO;
  protected fromDTO = fromDTO;

  async findByContextId(contextId: string): Promise<KnowledgeLineage | null> {
    return this.findOneWhere((d) => d.contextId === contextId);
  }

  async findByTraceTargetContextId(targetContextId: string): Promise<KnowledgeLineage[]> {
    return this.findWhere((d) =>
      d.traces.some((t) => t.toContextId === targetContextId),
    );
  }
}
