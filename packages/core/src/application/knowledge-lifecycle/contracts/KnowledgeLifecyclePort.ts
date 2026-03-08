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
  CreateContextInput,
  CreateContextResult,
  ArchiveContextInput,
  ArchiveContextResult,
  DeprecateContextInput,
  DeprecateContextResult,
  ActivateContextInput,
  ActivateContextResult,
  GetContextLineageInput,
  GetContextLineageResult,
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

  createContext(
    input: CreateContextInput,
  ): Promise<Result<KnowledgeLifecycleError, CreateContextResult>>;

  archiveContext(
    input: ArchiveContextInput,
  ): Promise<Result<KnowledgeLifecycleError, ArchiveContextResult>>;

  deprecateContext(
    input: DeprecateContextInput,
  ): Promise<Result<KnowledgeLifecycleError, DeprecateContextResult>>;

  activateContext(
    input: ActivateContextInput,
  ): Promise<Result<KnowledgeLifecycleError, ActivateContextResult>>;

  getContextLineage(
    input: GetContextLineageInput,
  ): Promise<Result<KnowledgeLifecycleError, GetContextLineageResult>>;
}
