import type { SourceRepository } from "../../domain/SourceRepository";
import type { Source } from "../../domain/Source";
import type { SourceType } from "../../domain/SourceType";
import { BaseInMemoryRepository } from "../../../../../platform/persistence/BaseInMemoryRepository";

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
