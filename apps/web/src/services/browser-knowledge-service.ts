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

  readonly contexts: KnowledgeService["contexts"];
  readonly sources: KnowledgeService["sources"];
  readonly profiles: KnowledgeService["profiles"];

  constructor(
    private readonly configStore?: ConfigStore,
    private readonly profile?: InfrastructureProfile,
  ) {
    this.contexts = {
      create: (input) => this._call(c => c.contexts.create(input)),
      get: (input) => this._call(c => c.contexts.get(input)),
      list: () => this._call(c => c.contexts.list()),
      listRefs: () => this._call(c => c.contexts.listRefs()),
      transitionState: (input) => this._call(c => c.contexts.transitionState(input)),
      updateProfile: (input) => this._call(c => c.contexts.updateProfile(input)),
      reconcileProjections: (input) => this._call(c => c.contexts.reconcileProjections(input)),
      reconcileAllProfiles: (input) => this._call(c => c.contexts.reconcileAllProfiles(input)),
      removeSource: (input) => this._call(c => c.contexts.removeSource(input)),
      link: (input) => this._call(c => c.contexts.link(input)),
      unlink: (input) => this._call(c => c.contexts.unlink(input)),
      getLineage: (input) => this._call(c => c.contexts.getLineage(input)),
    };

    this.sources = {
      list: () => this._call(c => c.sources.list()),
      get: (input) => this._call(c => c.sources.get(input)),
      getContexts: (input) => this._call(c => c.sources.getContexts(input)),
      processAllProfiles: (input) => this._call(c => c.sources.processAllProfiles(input)),
    };

    this.profiles = {
      create: (input) => this._call(c => c.profiles.create(input)),
      list: () => this._call(c => c.profiles.list()),
      update: (input) => this._call(c => c.profiles.update(input)),
      deprecate: (input) => this._call(c => c.profiles.deprecate(input)),
    };
  }

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
    await coordinator.profiles.create({
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
}
