import type { KnowledgeLineageRepository } from "../../../domain/KnowledgeLineageRepository";
import type { KnowledgeLineage } from "../../../domain/KnowledgeLineage";
import { BaseIndexedDBRepository } from "../../../../../../shared/persistence/BaseIndexedDBRepository";
import { toDTO, fromDTO, type LineageDTO } from "./LineageDTO";

export class IndexedDBKnowledgeLineageRepository
  extends BaseIndexedDBRepository<KnowledgeLineage, LineageDTO>
  implements KnowledgeLineageRepository
{
  constructor(dbName: string = "knowledge-platform") {
    super(dbName, "knowledge-lineage");
  }

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
