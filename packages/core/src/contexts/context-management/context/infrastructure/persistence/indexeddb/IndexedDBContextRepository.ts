import type { ContextRepository } from "../../../domain/ContextRepository";
import type { Context } from "../../../domain/Context";
import type { ContextState } from "../../../domain/ContextState";
import { BaseIndexedDBRepository } from "../../../../../../shared/persistence/BaseIndexedDBRepository";
import { toDTO, fromDTO, type ContextDTO } from "./ContextDTO";

export class IndexedDBContextRepository
  extends BaseIndexedDBRepository<Context, ContextDTO>
  implements ContextRepository
{
  constructor(dbName: string = "knowledge-platform") {
    super(dbName, "contexts");
  }

  protected toDTO = toDTO;
  protected fromDTO = fromDTO;

  async findBySourceId(sourceId: string): Promise<Context[]> {
    return this.findWhere((d) =>
      d.sources.some((s) => s.sourceId === sourceId),
    );
  }

  async findByState(state: ContextState): Promise<Context[]> {
    return this.findWhere((d) => d.state === state);
  }

  async findByRequiredProfileId(profileId: string): Promise<Context[]> {
    return this.findWhere((d) => d.requiredProfileId === profileId);
  }

  async findAll(): Promise<Context[]> {
    const all = await this.store.getAll();
    return all.map((dto) => this.fromDTO(dto));
  }
}
