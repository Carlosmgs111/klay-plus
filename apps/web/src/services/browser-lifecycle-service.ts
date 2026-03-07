import type { LifecycleService } from "./lifecycle-service";
import type { ServiceResult } from "./types";
import type { KnowledgeLifecycleUIAdapter } from "@klay/core/adapters/ui";
import type { KnowledgeManagementUIAdapter } from "@klay/core/adapters/ui";
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

interface LifecycleAdapters {
  lifecycle: KnowledgeLifecycleUIAdapter;
  management: KnowledgeManagementUIAdapter;
}

/**
 * BrowserLifecycleService — runs lifecycle operations entirely in the browser.
 *
 * Uses dynamic imports to lazily load @klay/core and create a platform
 * with IndexedDB storage and hash embeddings.
 */
export class BrowserLifecycleService implements LifecycleService {
  private _adaptersPromise: Promise<LifecycleAdapters> | null = null;

  private _getAdapters(): Promise<LifecycleAdapters> {
    if (!this._adaptersPromise) {
      this._adaptersPromise = this._initAdapters();
    }
    return this._adaptersPromise;
  }

  private async _initAdapters(): Promise<LifecycleAdapters> {
    const [
      { createKnowledgePlatform },
      { KnowledgeLifecycleUIAdapter, KnowledgeManagementUIAdapter },
    ] = await Promise.all([
      import("@klay/core"),
      import("@klay/core/adapters/ui"),
    ]);

    const platform = await createKnowledgePlatform({
      provider: "browser",
      dbName: "klay-dashboard",
      embeddingDimensions: 128,
    });

    return {
      lifecycle: new KnowledgeLifecycleUIAdapter(platform.lifecycle),
      management: new KnowledgeManagementUIAdapter(platform.management),
    };
  }

  async removeSource(
    input: RemoveSourceInput,
  ): Promise<ServiceResult<RemoveSourceResult>> {
    const { lifecycle } = await this._getAdapters();
    return lifecycle.removeSource(input) as Promise<ServiceResult<RemoveSourceResult>>;
  }

  async reprocessContext(
    input: ReprocessContextInput,
  ): Promise<ServiceResult<ReprocessContextResult>> {
    const { lifecycle } = await this._getAdapters();
    return lifecycle.reprocessContext(input) as Promise<ServiceResult<ReprocessContextResult>>;
  }

  async rollbackContext(
    input: RollbackContextInput,
  ): Promise<ServiceResult<RollbackContextResult>> {
    const { lifecycle } = await this._getAdapters();
    return lifecycle.rollbackContext(input) as Promise<ServiceResult<RollbackContextResult>>;
  }

  async linkContexts(
    input: LinkContextsInput,
  ): Promise<ServiceResult<LinkContextsResult>> {
    const { lifecycle } = await this._getAdapters();
    return lifecycle.linkContexts(input) as Promise<ServiceResult<LinkContextsResult>>;
  }

  async unlinkContexts(
    input: UnlinkContextsInput,
  ): Promise<ServiceResult<UnlinkContextsResult>> {
    const { lifecycle } = await this._getAdapters();
    return lifecycle.unlinkContexts(input) as Promise<ServiceResult<UnlinkContextsResult>>;
  }

  async ingestAndAddSource(
    input: IngestAndAddSourceInput,
  ): Promise<ServiceResult<IngestAndAddSourceSuccess>> {
    const { management } = await this._getAdapters();
    return management.ingestAndAddSource(input) as Promise<
      ServiceResult<IngestAndAddSourceSuccess>
    >;
  }
}
