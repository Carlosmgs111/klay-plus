import type { KnowledgeLineageRepository } from "../../../domain/KnowledgeLineageRepository";
import type { KnowledgeLineage } from "../../../domain/KnowledgeLineage";
import { BaseIndexedDBRepository } from "../../../../../../platform/persistence/BaseIndexedDBRepository";
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

  async findBySemanticUnitId(semanticUnitId: string): Promise<KnowledgeLineage | null> {
    return this.findOneWhere((d) => d.semanticUnitId === semanticUnitId);
  }

  async findByTraceTargetUnitId(targetUnitId: string): Promise<KnowledgeLineage[]> {
    return this.findWhere((d) =>
      d.traces.some((t) => t.toUnitId === targetUnitId),
    );
  }
}
