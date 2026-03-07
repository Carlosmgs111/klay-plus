import type { LifecycleService } from "./lifecycle-service";
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
 * ServerLifecycleService — delegates to /api/lifecycle/* routes via fetch.
 */
export class ServerLifecycleService implements LifecycleService {
  async removeSource(
    input: RemoveSourceInput,
  ): Promise<ServiceResult<RemoveSourceResult>> {
    return this._post("/api/lifecycle/remove-source", input);
  }

  async reprocessContext(
    input: ReprocessContextInput,
  ): Promise<ServiceResult<ReprocessContextResult>> {
    return this._post("/api/lifecycle/reprocess", input);
  }

  async rollbackContext(
    input: RollbackContextInput,
  ): Promise<ServiceResult<RollbackContextResult>> {
    return this._post("/api/lifecycle/rollback", input);
  }

  async linkContexts(
    input: LinkContextsInput,
  ): Promise<ServiceResult<LinkContextsResult>> {
    return this._post("/api/lifecycle/link", input);
  }

  async unlinkContexts(
    input: UnlinkContextsInput,
  ): Promise<ServiceResult<UnlinkContextsResult>> {
    return this._post("/api/lifecycle/unlink", input);
  }

  async ingestAndAddSource(
    input: IngestAndAddSourceInput,
  ): Promise<ServiceResult<IngestAndAddSourceSuccess>> {
    return this._post("/api/lifecycle/ingest-add-source", input);
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async _post<T>(path: string, body: unknown): Promise<ServiceResult<T>> {
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      return json as ServiceResult<T>;
    } catch (err) {
      return {
        success: false,
        error: {
          message: err instanceof Error ? err.message : "Network error",
          code: "NETWORK_ERROR",
        },
      };
    }
  }
}
