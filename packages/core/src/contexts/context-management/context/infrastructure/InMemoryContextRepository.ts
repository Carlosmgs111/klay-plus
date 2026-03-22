import type { ContextRepository } from "../domain/ContextRepository";
import type { Context } from "../domain/Context";
import type { ContextState } from "../domain/ContextState";
import { BaseInMemoryRepository } from "../../../../platform/persistence/BaseInMemoryRepository";

export class InMemoryContextRepository
  extends BaseInMemoryRepository<Context>
  implements ContextRepository
{
  async findBySourceId(sourceId: string): Promise<Context[]> {
    return this.findWhere((ctx) =>
      ctx.allSources.some((s) => s.sourceId === sourceId),
    );
  }

  async findByState(state: ContextState): Promise<Context[]> {
    return this.findWhere((ctx) => ctx.state === state);
  }

  async findByRequiredProfileId(profileId: string): Promise<Context[]> {
    return this.findWhere((ctx) => ctx.requiredProfileId === profileId);
  }

  async findAll(): Promise<Context[]> {
    return this.findWhere(() => true);
  }
}
