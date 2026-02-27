import type { KnowledgeLineageRepository } from "../../domain/KnowledgeLineageRepository";
import type { KnowledgeLineage } from "../../domain/KnowledgeLineage";
import { BaseInMemoryRepository } from "../../../../../platform/persistence/BaseInMemoryRepository";

export class InMemoryKnowledgeLineageRepository
  extends BaseInMemoryRepository<KnowledgeLineage>
  implements KnowledgeLineageRepository
{
  async findBySemanticUnitId(semanticUnitId: string): Promise<KnowledgeLineage | null> {
    return this.findOneWhere((l) => l.semanticUnitId === semanticUnitId);
  }

  async findByTraceTargetUnitId(targetUnitId: string): Promise<KnowledgeLineage[]> {
    return this.findWhere((l) =>
      l.traces.some((t) => t.toUnitId === targetUnitId),
    );
  }
}
