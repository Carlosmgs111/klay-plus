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
} from "@klay/core/management";
import type { ConfigStore, InfrastructureProfile } from "@klay/core/config";

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

  constructor(
    private readonly configStore?: ConfigStore,
    private readonly profile?: InfrastructureProfile,
  ) {}

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
      ...(this.profile && { infrastructure: this.profile }),
      ...(this.configStore && { configStore: this.configStore }),
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

  async createContext(
    input: CreateContextInput,
  ): Promise<ServiceResult<CreateContextResult>> {
    const { lifecycle } = await this._getAdapters();
    return lifecycle.createContext(input) as Promise<ServiceResult<CreateContextResult>>;
  }

  async archiveContext(
    input: ArchiveContextInput,
  ): Promise<ServiceResult<ArchiveContextResult>> {
    const { lifecycle } = await this._getAdapters();
    return lifecycle.archiveContext(input) as Promise<ServiceResult<ArchiveContextResult>>;
  }

  async deprecateContext(
    input: DeprecateContextInput,
  ): Promise<ServiceResult<DeprecateContextResult>> {
    const { lifecycle } = await this._getAdapters();
    return lifecycle.deprecateContext(input) as Promise<ServiceResult<DeprecateContextResult>>;
  }

  async activateContext(
    input: ActivateContextInput,
  ): Promise<ServiceResult<ActivateContextResult>> {
    const { lifecycle } = await this._getAdapters();
    return lifecycle.activateContext(input) as Promise<ServiceResult<ActivateContextResult>>;
  }

  async getContextLineage(
    input: GetContextLineageInput,
  ): Promise<ServiceResult<GetContextLineageResult>> {
    const { lifecycle } = await this._getAdapters();
    return lifecycle.getContextLineage(input) as Promise<ServiceResult<GetContextLineageResult>>;
  }

  async generateProjection(
    input: GenerateProjectionInput,
  ): Promise<ServiceResult<GenerateProjectionResult>> {
    const { lifecycle } = await this._getAdapters();
    return lifecycle.generateProjection(input) as Promise<ServiceResult<GenerateProjectionResult>>;
  }
}
