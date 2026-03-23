import type { ContextRepository } from "../../../domain/ContextRepository";
import type { Context } from "../../../domain/Context";
import type { ContextState } from "../../../domain/ContextState";
import { BaseNeDBRepository } from "../../../../../../shared/persistence/BaseNeDBRepository";
import { toDTO, fromDTO, type ContextDTO } from "../indexeddb/ContextDTO";

export class NeDBContextRepository
  extends BaseNeDBRepository<Context, ContextDTO>
  implements ContextRepository
{
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
