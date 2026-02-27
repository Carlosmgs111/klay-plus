import type { SourceRepository } from "../../../domain/SourceRepository.js";
import type { Source } from "../../../domain/Source.js";
import type { SourceType } from "../../../domain/SourceType.js";
import { BaseIndexedDBRepository } from "../../../../../../platform/persistence/BaseIndexedDBRepository.js";
import { toDTO, fromDTO, type SourceDTO } from "./SourceDTO.js";

export class IndexedDBSourceRepository
  extends BaseIndexedDBRepository<Source, SourceDTO>
  implements SourceRepository
{
  constructor(dbName: string = "knowledge-platform") {
    super(dbName, "sources");
  }

  protected toDTO = toDTO;
  protected fromDTO = fromDTO;

  async findByType(type: SourceType): Promise<Source[]> {
    return this.findWhere((d) => d.type === type);
  }

  async findByUri(uri: string): Promise<Source | null> {
    return this.findOneWhere((d) => d.uri === uri);
  }
}
