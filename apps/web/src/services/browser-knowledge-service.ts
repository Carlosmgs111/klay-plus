import type { KnowledgeService } from "./knowledge-service";
import type { ServiceResult } from "./types";
import type { KnowledgeApplication } from "@klay/core";
import type {
  ProcessKnowledgeInput,
  ProcessKnowledgeSuccess,
  SearchKnowledgeInput,
  SearchKnowledgeSuccess,
} from "@klay/core";
import type { ConfigStore, InfrastructureProfile } from "@klay/core/config";
import {
  mapResult,
  mapCreateContextResult,
  mapTransitionResult,
  mapTransitionInput,
  mapRemoveSourceResult,
  mapUpdateContextProfileResult,
  mapLinkResult,
  mapLinkInput,
  mapUnlinkResult,
  mapUnlinkInput,
  mapLineageResult,
  mapSourcesToDTO,
  mapSourceToDetailDTO,
  mapProfilesToDTO,
} from "./knowledge-mappers";

/**
 * BrowserKnowledgeService — runs all operations entirely in the browser.
 *
 * Uses dynamic imports to lazily load @klay/core and create an application
 * with IndexedDB storage and hash embeddings.
 */
export class BrowserKnowledgeService implements KnowledgeService {
  private _appPromise: Promise<KnowledgeApplication> | null = null;

  constructor(
    private readonly configStore?: ConfigStore,
    private readonly profile?: InfrastructureProfile,
  ) {}

  private _getApp(): Promise<KnowledgeApplication> {
    if (!this._appPromise) {
      this._appPromise = this._initApp();
    }
    return this._appPromise;
  }

  private async _initApp(): Promise<KnowledgeApplication> {
    const { createKnowledgeApplication } = await import("@klay/core");

    const app = await createKnowledgeApplication({
      provider: "browser",
      dbName: "klay-dashboard",
      embeddingDimensions: 128,
      ...(this.profile && { infrastructure: this.profile }),
      ...(this.configStore && { configStore: this.configStore }),
    });

    // Seed default processing profile (ignore if already exists)
    await app.semanticProcessing.createProcessingProfile.execute({
      id: "default",
      name: "Default",
      preparation: { strategyId: "basic", config: {} },
      fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
      projection: { strategyId: "hash-embedding", config: {} },
    });

    return app;
  }

  private async _callResult<T>(fn: (app: KnowledgeApplication) => Promise<any>): Promise<ServiceResult<T>> {
    const { unwrapResult } = await import("@klay/core/result");
    const app = await this._getApp();
    return unwrapResult(await fn(app)) as ServiceResult<T>;
  }

  // ── Cross-cutting ──────────────────────────────────────────────────

  async process(input: ProcessKnowledgeInput): Promise<ServiceResult<ProcessKnowledgeSuccess>> {
    return this._callResult(app => app.processKnowledge.execute(input));
  }

  async search(input: SearchKnowledgeInput): Promise<ServiceResult<SearchKnowledgeSuccess>> {
    return this._callResult(app => app.knowledgeRetrieval.searchKnowledge.execute(input));
  }

  // ── Contexts ──────────────────────────────────────────────────────

  async createContext(input: Parameters<KnowledgeService["createContext"]>[0]) {
    return this._callResult(app =>
      app.contextManagement.createContextAndActivate.execute(input)
        .then(raw => mapResult(raw, mapCreateContextResult)),
    );
  }

  getContext(input: Parameters<KnowledgeService["getContext"]>[0]) {
    return this._callResult(app => app.contextManagement.contextReadModel.getDetail(input.contextId));
  }

  listContexts() {
    return this._callResult(app => app.contextManagement.contextReadModel.listSummary());
  }

  listContextRefs() {
    return this._callResult(app => app.contextManagement.contextQueries.listRefs());
  }

  async transitionContextState(input: Parameters<KnowledgeService["transitionContextState"]>[0]) {
    return this._callResult(app =>
      app.contextManagement.transitionContextState.execute(mapTransitionInput(input))
        .then(raw => mapResult(raw, mapTransitionResult)),
    );
  }

  async updateContextProfile(input: Parameters<KnowledgeService["updateContextProfile"]>[0]) {
    return this._callResult(app =>
      app.contextManagement.updateContextProfileAndReconcile.execute(input)
        .then(raw => mapResult(raw, mapUpdateContextProfileResult)),
    );
  }

  reconcileProjections(input: Parameters<KnowledgeService["reconcileProjections"]>[0]) {
    return this._callResult(app => app.contextManagement.reconcileProjections.execute(input));
  }

  reconcileAllProfiles(input: Parameters<KnowledgeService["reconcileAllProfiles"]>[0]) {
    return this._callResult(app => app.contextManagement.reconcileProjections.executeAllProfiles(input));
  }

  async removeSourceFromContext(input: Parameters<KnowledgeService["removeSourceFromContext"]>[0]) {
    return this._callResult(app =>
      app.contextManagement.removeSourceFromContext.execute(input)
        .then(raw => mapResult(raw, mapRemoveSourceResult)),
    );
  }

  async linkContexts(input: Parameters<KnowledgeService["linkContexts"]>[0]) {
    return this._callResult(app =>
      app.contextManagement.linkContexts.execute(mapLinkInput(input))
        .then(raw => mapResult(raw, mapLinkResult)),
    );
  }

  async unlinkContexts(input: Parameters<KnowledgeService["unlinkContexts"]>[0]) {
    return this._callResult(app =>
      app.contextManagement.unlinkContexts.execute(mapUnlinkInput(input))
        .then(raw => mapResult(raw, mapUnlinkResult)),
    );
  }

  async getContextLineage(input: Parameters<KnowledgeService["getContextLineage"]>[0]) {
    return this._callResult(app =>
      app.contextManagement.lineageQueries.getLineage(input.contextId)
        .then(raw => mapResult(raw, mapLineageResult)),
    );
  }

  // ── Sources ──────────────────────────────────────────────────────

  async listSources(): Promise<ServiceResult<any>> {
    try {
      const app = await this._getApp();
      const sources = await app.sourceIngestion.sourceQueries.listAll();
      return { success: true, data: mapSourcesToDTO(sources) };
    } catch (error: any) {
      return { success: false, error: { message: error?.message ?? "Unknown error", code: "UNKNOWN" } };
    }
  }

  async getSource(input: Parameters<KnowledgeService["getSource"]>[0]): Promise<ServiceResult<any>> {
    try {
      const app = await this._getApp();
      const source = await app.sourceIngestion.sourceQueries.getById(input.sourceId);
      if (!source) {
        return { success: false, error: { message: `Source ${input.sourceId} not found`, code: "SOURCE_NOT_FOUND" } };
      }
      return { success: true, data: await mapSourceToDetailDTO(source, app.sourceIngestion.sourceQueries) };
    } catch (error: any) {
      return { success: false, error: { message: error?.message ?? "Unknown error", code: "UNKNOWN" } };
    }
  }

  getSourceContexts(input: Parameters<KnowledgeService["getSourceContexts"]>[0]) {
    return this._callResult(app => app.contextManagement.contextQueries.listBySource(input.sourceId));
  }

  processSourceAllProfiles(input: Parameters<KnowledgeService["processSourceAllProfiles"]>[0]) {
    return this._callResult(app => app.semanticProcessing.processSourceAllProfiles.execute(input));
  }

  // ── Profiles ──────────────────────────────────────────────────────

  async createProfile(input: Parameters<KnowledgeService["createProfile"]>[0]) {
    return this._callResult(app => app.semanticProcessing.createProcessingProfile.execute(input));
  }

  async listProfiles(): Promise<ServiceResult<any>> {
    try {
      const app = await this._getApp();
      const profiles = await app.semanticProcessing.profileQueries.listAll();
      return { success: true, data: mapProfilesToDTO(profiles) };
    } catch (error: any) {
      return { success: false, error: { message: error?.message ?? "Unknown error", code: "UNKNOWN" } };
    }
  }

  async updateProfile(input: Parameters<KnowledgeService["updateProfile"]>[0]) {
    return this._callResult(app => app.semanticProcessing.updateProcessingProfile.execute(input));
  }

  async deprecateProfile(input: Parameters<KnowledgeService["deprecateProfile"]>[0]) {
    return this._callResult(app => app.semanticProcessing.deprecateProcessingProfile.execute(input));
  }
}
