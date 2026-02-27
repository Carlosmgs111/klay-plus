import type { SourceRepository } from "../../../domain/SourceRepository.js";
import type { Source } from "../../../domain/Source.js";
import type { SourceType } from "../../../domain/SourceType.js";
import { BaseNeDBRepository } from "../../../../../../platform/persistence/BaseNeDBRepository.js";
import { toDTO, fromDTO, type SourceDTO } from "../indexeddb/SourceDTO.js";

export class NeDBSourceRepository
  extends BaseNeDBRepository<Source, SourceDTO>
  implements SourceRepository
{
  protected toDTO = toDTO;
  protected fromDTO = fromDTO;

  async findByType(type: SourceType): Promise<Source[]> {
    return this.findWhere((d) => d.type === type);
  }

  async findByUri(uri: string): Promise<Source | null> {
    return this.findOneWhere((d) => d.uri === uri);
  }
}
