import type { Repository } from "../../../../shared/domain";
import type { Context } from "./Context";
import type { ContextId } from "./ContextId";
import type { ContextState } from "./ContextState";

export interface ContextRepository
  extends Repository<Context, ContextId> {
  findBySourceId(sourceId: string): Promise<Context[]>;
  findByState(state: ContextState): Promise<Context[]>;
  findByRequiredProfileId(profileId: string): Promise<Context[]>;
  exists(id: ContextId): Promise<boolean>;
  findAll(): Promise<Context[]>;
}
