import type { SemanticUnitRepository } from "../../domain/SemanticUnitRepository";
import type { SemanticUnit } from "../../domain/SemanticUnit";
import type { SemanticState } from "../../domain/SemanticState";
import { BaseInMemoryRepository } from "../../../../../platform/persistence/BaseInMemoryRepository";

export class InMemorySemanticUnitRepository
  extends BaseInMemoryRepository<SemanticUnit>
  implements SemanticUnitRepository
{
  async findBySourceId(sourceId: string): Promise<SemanticUnit[]> {
    return this.findWhere((u) =>
      u.allSources.some((s) => s.sourceId === sourceId),
    );
  }

  async findByState(state: SemanticState): Promise<SemanticUnit[]> {
    return this.findWhere((u) => u.state === state);
  }

  async findByTags(tags: string[]): Promise<SemanticUnit[]> {
    const tagSet = new Set(tags);
    return this.findWhere((u) =>
      u.metadata.tags.some((t) => tagSet.has(t)),
    );
  }
}
