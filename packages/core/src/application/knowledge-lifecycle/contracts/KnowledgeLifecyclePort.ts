import type { Result } from "../../../shared/domain/Result";
import type { KnowledgeLifecycleError } from "../domain/KnowledgeLifecycleError";
import type {
  RemoveSourceInput,
  RemoveSourceResult,
  ReprocessContextInput,
  ReprocessContextResult,
  RollbackContextInput,
  RollbackContextResult,
  LinkContextsInput,
  LinkContextsResult,
  UnlinkContextsInput,
  UnlinkContextsResult,
} from "./dtos";

export interface KnowledgeLifecyclePort {
  removeSource(
    input: RemoveSourceInput,
  ): Promise<Result<KnowledgeLifecycleError, RemoveSourceResult>>;

  reprocessContext(
    input: ReprocessContextInput,
  ): Promise<Result<KnowledgeLifecycleError, ReprocessContextResult>>;

  rollbackContext(
    input: RollbackContextInput,
  ): Promise<Result<KnowledgeLifecycleError, RollbackContextResult>>;

  linkContexts(
    input: LinkContextsInput,
  ): Promise<Result<KnowledgeLifecycleError, LinkContextsResult>>;

  unlinkContexts(
    input: UnlinkContextsInput,
  ): Promise<Result<KnowledgeLifecycleError, UnlinkContextsResult>>;
}
