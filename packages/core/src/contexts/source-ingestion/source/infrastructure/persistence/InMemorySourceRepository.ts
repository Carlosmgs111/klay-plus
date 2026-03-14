import type { SourceRepository } from "../../domain/SourceRepository";
import type { Source } from "../../domain/Source";
import { BaseInMemoryRepository } from "../../../../../platform/persistence/BaseInMemoryRepository";

export class InMemorySourceRepository
  extends BaseInMemoryRepository<Source>
  implements SourceRepository
{
  async findByUri(uri: string): Promise<Source | null> {
    return this.findOneWhere((s) => s.uri === uri);
  }
}
