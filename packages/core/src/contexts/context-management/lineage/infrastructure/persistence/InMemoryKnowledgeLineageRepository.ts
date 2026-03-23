import type { KnowledgeLineageRepository } from "../../domain/KnowledgeLineageRepository";
import type { KnowledgeLineage } from "../../domain/KnowledgeLineage";
import { BaseInMemoryRepository } from "../../../../../shared/persistence/BaseInMemoryRepository";

export class InMemoryKnowledgeLineageRepository
  extends BaseInMemoryRepository<KnowledgeLineage>
  implements KnowledgeLineageRepository
{
  async findByContextId(contextId: string): Promise<KnowledgeLineage | null> {
    return this.findOneWhere((l) => l.contextId === contextId);
  }

  async findByTraceTargetContextId(targetContextId: string): Promise<KnowledgeLineage[]> {
    return this.findWhere((l) =>
      l.traces.some((t) => t.toContextId === targetContextId),
    );
  }
}
