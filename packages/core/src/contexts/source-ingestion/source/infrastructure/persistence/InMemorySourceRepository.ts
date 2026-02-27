import type { SourceRepository } from "../../domain/SourceRepository.js";
import type { Source } from "../../domain/Source.js";
import type { SourceType } from "../../domain/SourceType.js";
import { BaseInMemoryRepository } from "../../../../../platform/persistence/BaseInMemoryRepository.js";

export class InMemorySourceRepository
  extends BaseInMemoryRepository<Source>
  implements SourceRepository
{
  async findByType(type: SourceType): Promise<Source[]> {
    return this.findWhere((s) => s.type === type);
  }

  async findByUri(uri: string): Promise<Source | null> {
    return this.findOneWhere((s) => s.uri === uri);
  }
}
