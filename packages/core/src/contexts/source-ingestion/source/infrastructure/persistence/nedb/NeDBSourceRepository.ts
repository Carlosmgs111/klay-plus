import type { SourceRepository } from "../../../domain/SourceRepository";
import type { Source } from "../../../domain/Source";
import { BaseNeDBRepository } from "../../../../../../platform/persistence/BaseNeDBRepository";
import { toDTO, fromDTO, type SourceDTO } from "../indexeddb/SourceDTO";

export class NeDBSourceRepository
  extends BaseNeDBRepository<Source, SourceDTO>
  implements SourceRepository
{
  protected toDTO = toDTO;
  protected fromDTO = fromDTO;

  async findByUri(uri: string): Promise<Source | null> {
    return this.findOneWhere((d) => d.uri === uri);
  }
}
