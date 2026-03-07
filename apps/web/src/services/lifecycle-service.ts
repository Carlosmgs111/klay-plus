import type { ServiceResult } from "./types";
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
} from "@klay/core/lifecycle";
import type {
  IngestAndAddSourceInput,
  IngestAndAddSourceSuccess,
} from "@klay/core/management";

/**
 * LifecycleService — runtime-agnostic interface for lifecycle operations.
 *
 * Implemented by:
 * - ServerLifecycleService (fetches /api/lifecycle/* routes)
 * - BrowserLifecycleService (calls KnowledgeLifecycleUIAdapter + KnowledgeManagementUIAdapter directly)
 */
export interface LifecycleService {
  removeSource(
    input: RemoveSourceInput,
  ): Promise<ServiceResult<RemoveSourceResult>>;

  reprocessContext(
    input: ReprocessContextInput,
  ): Promise<ServiceResult<ReprocessContextResult>>;

  rollbackContext(
    input: RollbackContextInput,
  ): Promise<ServiceResult<RollbackContextResult>>;

  linkContexts(
    input: LinkContextsInput,
  ): Promise<ServiceResult<LinkContextsResult>>;

  unlinkContexts(
    input: UnlinkContextsInput,
  ): Promise<ServiceResult<UnlinkContextsResult>>;

  ingestAndAddSource(
    input: IngestAndAddSourceInput,
  ): Promise<ServiceResult<IngestAndAddSourceSuccess>>;
}
