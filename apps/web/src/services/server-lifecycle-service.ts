import type { LifecycleService } from "./lifecycle-service";
import type { ServiceResult } from "./types";
import { serverPost, encodeContentForTransport } from "./server-http-client";
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
  GenerateProjectionInput,
  GenerateProjectionResult,
} from "@klay/core/lifecycle";
import type {
  IngestAndAddSourceInput,
  IngestAndAddSourceSuccess,
} from "@klay/core";

/**
 * ServerLifecycleService — delegates to /api/lifecycle/* routes via fetch.
 */
export class ServerLifecycleService implements LifecycleService {
  async removeSource(
    input: RemoveSourceInput,
  ): Promise<ServiceResult<RemoveSourceResult>> {
    return serverPost("/api/lifecycle/remove-source", input);
  }

  async reprocessContext(
    input: ReprocessContextInput,
  ): Promise<ServiceResult<ReprocessContextResult>> {
    return serverPost("/api/lifecycle/reprocess", input);
  }

  async rollbackContext(
    input: RollbackContextInput,
  ): Promise<ServiceResult<RollbackContextResult>> {
    return serverPost("/api/lifecycle/rollback", input);
  }

  async linkContexts(
    input: LinkContextsInput,
  ): Promise<ServiceResult<LinkContextsResult>> {
    return serverPost("/api/lifecycle/link", input);
  }

  async unlinkContexts(
    input: UnlinkContextsInput,
  ): Promise<ServiceResult<UnlinkContextsResult>> {
    return serverPost("/api/lifecycle/unlink", input);
  }

  async ingestAndAddSource(
    input: IngestAndAddSourceInput,
  ): Promise<ServiceResult<IngestAndAddSourceSuccess>> {
    return serverPost("/api/lifecycle/ingest-add-source", encodeContentForTransport({ ...input }));
  }

  async createContext(
    input: CreateContextInput,
  ): Promise<ServiceResult<CreateContextResult>> {
    return serverPost("/api/lifecycle/create-context", input);
  }

  async archiveContext(
    input: ArchiveContextInput,
  ): Promise<ServiceResult<ArchiveContextResult>> {
    return serverPost("/api/lifecycle/archive-context", input);
  }

  async deprecateContext(
    input: DeprecateContextInput,
  ): Promise<ServiceResult<DeprecateContextResult>> {
    return serverPost("/api/lifecycle/deprecate-context", input);
  }

  async activateContext(
    input: ActivateContextInput,
  ): Promise<ServiceResult<ActivateContextResult>> {
    return serverPost("/api/lifecycle/activate-context", input);
  }

  async getContextLineage(
    input: GetContextLineageInput,
  ): Promise<ServiceResult<GetContextLineageResult>> {
    return serverPost("/api/lifecycle/get-lineage", input);
  }

  async generateProjection(
    input: GenerateProjectionInput,
  ): Promise<ServiceResult<GenerateProjectionResult>> {
    return serverPost("/api/lifecycle/generate-projection", input);
  }
}
