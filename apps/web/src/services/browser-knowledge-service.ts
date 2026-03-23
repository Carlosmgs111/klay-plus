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
    await app.createProcessingProfile.execute({
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
    return this._callResult(app => app.searchKnowledge.execute(input));
  }

  // ── Contexts ──────────────────────────────────────────────────────

  createContext(input: Parameters<KnowledgeService["createContext"]>[0]) {
    return this._callResult(app => app.createContextAndActivate.execute(input));
  }

  getContext(input: Parameters<KnowledgeService["getContext"]>[0]) {
    return this._callResult(app => app.contextQueries.getDetail(input.contextId));
  }

  listContexts() {
    return this._callResult(app => app.contextQueries.listSummary());
  }

  listContextRefs() {
    return this._callResult(app => app.contextQueries.listRefs());
  }

  async transitionContextState(input: Parameters<KnowledgeService["transitionContextState"]>[0]) {
    const { executeTransitionContextState } = await import("@klay/core");
    return this._callResult(app => executeTransitionContextState(app.transitionContextState, input));
  }

  updateContextProfile(input: Parameters<KnowledgeService["updateContextProfile"]>[0]) {
    return this._callResult(app => app.updateContextProfileAndReconcile.execute(input));
  }

  reconcileProjections(input: Parameters<KnowledgeService["reconcileProjections"]>[0]) {
    return this._callResult(app => app.reconcileProjections.execute(input));
  }

  reconcileAllProfiles(input: Parameters<KnowledgeService["reconcileAllProfiles"]>[0]) {
    return this._callResult(app => app.reconcileProjections.executeAllProfiles(input));
  }

  async removeSourceFromContext(input: Parameters<KnowledgeService["removeSourceFromContext"]>[0]) {
    const { executeRemoveSource } = await import("@klay/core");
    return this._callResult(app => executeRemoveSource(app.removeSourceFromContext, input));
  }

  async linkContexts(input: Parameters<KnowledgeService["linkContexts"]>[0]) {
    const { executeLinkContexts } = await import("@klay/core");
    return this._callResult(app => executeLinkContexts(app.linkContexts, input));
  }

  async unlinkContexts(input: Parameters<KnowledgeService["unlinkContexts"]>[0]) {
    const { executeUnlinkContexts } = await import("@klay/core");
    return this._callResult(app => executeUnlinkContexts(app.unlinkContexts, input));
  }

  async getContextLineage(input: Parameters<KnowledgeService["getContextLineage"]>[0]) {
    const { executeGetContextLineage } = await import("@klay/core");
    return this._callResult(app => executeGetContextLineage(app.lineageQueries, input.contextId));
  }

  // ── Sources ──────────────────────────────────────────────────────

  async listSources() {
    const { executeListSources } = await import("@klay/core");
    return this._callResult(app => executeListSources(app.sourceQueries));
  }

  async getSource(input: Parameters<KnowledgeService["getSource"]>[0]) {
    const { executeGetSource } = await import("@klay/core");
    return this._callResult(app => executeGetSource(app.sourceQueries, input.sourceId));
  }

  getSourceContexts(input: Parameters<KnowledgeService["getSourceContexts"]>[0]) {
    return this._callResult(app => app.contextQueries.listBySource(input.sourceId));
  }

  processSourceAllProfiles(input: Parameters<KnowledgeService["processSourceAllProfiles"]>[0]) {
    return this._callResult(app => app.processSourceAllProfiles.execute(input));
  }

  // ── Profiles ──────────────────────────────────────────────────────

  async createProfile(input: Parameters<KnowledgeService["createProfile"]>[0]) {
    const { executeCreateProfile } = await import("@klay/core");
    return this._callResult(app => executeCreateProfile(app.createProcessingProfile, input));
  }

  async listProfiles() {
    const { executeListProfiles } = await import("@klay/core");
    return this._callResult(app => executeListProfiles(app.profileQueries));
  }

  async updateProfile(input: Parameters<KnowledgeService["updateProfile"]>[0]) {
    const { executeUpdateProfile } = await import("@klay/core");
    return this._callResult(app => executeUpdateProfile(app.updateProcessingProfile, input));
  }

  async deprecateProfile(input: Parameters<KnowledgeService["deprecateProfile"]>[0]) {
    const { executeDeprecateProfile } = await import("@klay/core");
    return this._callResult(app => executeDeprecateProfile(app.deprecateProcessingProfile, input));
  }
}
