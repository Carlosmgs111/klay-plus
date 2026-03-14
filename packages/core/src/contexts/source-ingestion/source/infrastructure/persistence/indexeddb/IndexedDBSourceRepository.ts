import type { SourceRepository } from "../../../domain/SourceRepository";
import type { Source } from "../../../domain/Source";
import { BaseIndexedDBRepository } from "../../../../../../platform/persistence/BaseIndexedDBRepository";
import { toDTO, fromDTO, type SourceDTO } from "./SourceDTO";

export class IndexedDBSourceRepository
  extends BaseIndexedDBRepository<Source, SourceDTO>
  implements SourceRepository
{
  constructor(dbName: string = "knowledge-platform") {
    super(dbName, "sources");
  }

  protected toDTO = toDTO;
  protected fromDTO = fromDTO;

  async findByUri(uri: string): Promise<Source | null> {
    return this.findOneWhere((d) => d.uri === uri);
  }
}
