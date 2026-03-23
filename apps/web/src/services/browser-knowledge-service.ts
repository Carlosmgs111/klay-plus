import type { KnowledgeService } from "./knowledge-service";
import type { ServiceResult } from "./types";
import type { KnowledgeCoordinator } from "@klay/core";
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
 * Uses dynamic imports to lazily load @klay/core and create a platform
 * with IndexedDB storage and hash embeddings.
 */
export class BrowserKnowledgeService implements KnowledgeService {
  private _coordinatorPromise: Promise<KnowledgeCoordinator> | null = null;

  constructor(
    private readonly configStore?: ConfigStore,
    private readonly profile?: InfrastructureProfile,
  ) {}

  private _getCoordinator(): Promise<KnowledgeCoordinator> {
    if (!this._coordinatorPromise) {
      this._coordinatorPromise = this._initCoordinator();
    }
    return this._coordinatorPromise;
  }

  private async _initCoordinator(): Promise<KnowledgeCoordinator> {
    const { createKnowledgePlatform } = await import("@klay/core");

    const coordinator = await createKnowledgePlatform({
      provider: "browser",
      dbName: "klay-dashboard",
      embeddingDimensions: 128,
      ...(this.profile && { infrastructure: this.profile }),
      ...(this.configStore && { configStore: this.configStore }),
    });

    // Seed default processing profile (ignore if already exists)
    await coordinator.createProfile({
      id: "default",
      name: "Default",
      preparation: { strategyId: "basic", config: {} },
      fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
      projection: { strategyId: "hash-embedding", config: {} },
    });

    return coordinator;
  }

  private async _call<T>(fn: (c: KnowledgeCoordinator) => Promise<any>): Promise<ServiceResult<T>> {
    const { unwrapResult } = await import("@klay/core/result");
    const coordinator = await this._getCoordinator();
    return unwrapResult(await fn(coordinator)) as ServiceResult<T>;
  }

  // ── Cross-cutting ──────────────────────────────────────────────────

  async process(input: ProcessKnowledgeInput): Promise<ServiceResult<ProcessKnowledgeSuccess>> {
    return this._call(c => c.process(input));
  }

  async search(input: SearchKnowledgeInput): Promise<ServiceResult<SearchKnowledgeSuccess>> {
    return this._call(c => c.search(input));
  }

  // ── Contexts ──────────────────────────────────────────────────────

  createContext(input: Parameters<KnowledgeService["createContext"]>[0]) {
    return this._call(c => c.createContext(input));
  }

  getContext(input: Parameters<KnowledgeService["getContext"]>[0]) {
    return this._call(c => c.getContext(input));
  }

  listContexts() {
    return this._call(c => c.listContexts());
  }

  listContextRefs() {
    return this._call(c => c.listContextRefs());
  }

  transitionContextState(input: Parameters<KnowledgeService["transitionContextState"]>[0]) {
    return this._call(c => c.transitionContextState(input));
  }

  updateContextProfile(input: Parameters<KnowledgeService["updateContextProfile"]>[0]) {
    return this._call(c => c.updateContextProfile(input));
  }

  reconcileProjections(input: Parameters<KnowledgeService["reconcileProjections"]>[0]) {
    return this._call(c => c.reconcileProjections(input));
  }

  reconcileAllProfiles(input: Parameters<KnowledgeService["reconcileAllProfiles"]>[0]) {
    return this._call(c => c.reconcileAllProfiles(input));
  }

  removeSourceFromContext(input: Parameters<KnowledgeService["removeSourceFromContext"]>[0]) {
    return this._call(c => c.removeSourceFromContext(input));
  }

  linkContexts(input: Parameters<KnowledgeService["linkContexts"]>[0]) {
    return this._call(c => c.linkContexts(input));
  }

  unlinkContexts(input: Parameters<KnowledgeService["unlinkContexts"]>[0]) {
    return this._call(c => c.unlinkContexts(input));
  }

  getContextLineage(input: Parameters<KnowledgeService["getContextLineage"]>[0]) {
    return this._call(c => c.getContextLineage(input));
  }

  // ── Sources ──────────────────────────────────────────────────────

  listSources() {
    return this._call(c => c.listSources());
  }

  getSource(input: Parameters<KnowledgeService["getSource"]>[0]) {
    return this._call(c => c.getSource(input));
  }

  getSourceContexts(input: Parameters<KnowledgeService["getSourceContexts"]>[0]) {
    return this._call(c => c.getSourceContexts(input));
  }

  processSourceAllProfiles(input: Parameters<KnowledgeService["processSourceAllProfiles"]>[0]) {
    return this._call(c => c.processSourceAllProfiles(input));
  }

  // ── Profiles ──────────────────────────────────────────────────────

  createProfile(input: Parameters<KnowledgeService["createProfile"]>[0]) {
    return this._call(c => c.createProfile(input));
  }

  listProfiles() {
    return this._call(c => c.listProfiles());
  }

  updateProfile(input: Parameters<KnowledgeService["updateProfile"]>[0]) {
    return this._call(c => c.updateProfile(input));
  }

  deprecateProfile(input: Parameters<KnowledgeService["deprecateProfile"]>[0]) {
    return this._call(c => c.deprecateProfile(input));
  }
}
