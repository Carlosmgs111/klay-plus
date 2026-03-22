import type { KnowledgeService } from "./knowledge-service";
import type { ServiceResult } from "./types";
import { serverPost, serverPut, serverGet, encodeContentForTransport } from "./server-http-client";
import type {
  ProcessKnowledgeInput,
  ProcessKnowledgeSuccess,
  SearchKnowledgeInput,
  SearchKnowledgeSuccess,
} from "@klay/core";

/**
 * ServerKnowledgeService — delegates to /api/* routes via fetch.
 */
export class ServerKnowledgeService implements KnowledgeService {
  readonly contexts: KnowledgeService["contexts"];
  readonly sources: KnowledgeService["sources"];
  readonly profiles: KnowledgeService["profiles"];

  constructor() {
    this.contexts = {
      create: (input) => serverPost("/api/lifecycle/create-context", input),
      get: (input) => serverGet(`/api/pipeline/contexts?id=${encodeURIComponent(input.contextId)}`),
      list: () => serverGet("/api/pipeline/contexts?summary=true"),
      listRefs: () => serverGet("/api/pipeline/contexts"),
      transitionState: (input) => serverPost("/api/lifecycle/transition-state", input),
      updateProfile: (input) => serverPost("/api/lifecycle/update-context-profile", input),
      reconcileProjections: (input) => serverPost("/api/lifecycle/reconcile-projections", input),
      reconcileAllProfiles: (input) => serverPost("/api/lifecycle/reconcile-all-profiles", input),
      removeSource: (input) => serverPost("/api/lifecycle/remove-source", input),
      link: (input) => serverPost("/api/lifecycle/link", input),
      unlink: (input) => serverPost("/api/lifecycle/unlink", input),
      getLineage: (input) => serverPost("/api/lifecycle/get-lineage", input),
    };

    this.sources = {
      list: () => serverGet("/api/pipeline/sources"),
      get: (input) => serverGet(`/api/pipeline/sources/${input.sourceId}`),
      getContexts: (input) => serverGet(`/api/pipeline/sources/${input.sourceId}/contexts`),
      processAllProfiles: (input) => serverPost("/api/lifecycle/process-source-all-profiles", input),
    };

    this.profiles = {
      create: (input) => serverPost("/api/pipeline/profiles", input),
      list: () => serverGet("/api/pipeline/profiles"),
      update: (input) => serverPut("/api/pipeline/profiles", input),
      deprecate: (input) => serverPost("/api/pipeline/profiles/deprecate", input),
    };
  }

  // ── Cross-cutting ──────────────────────────────────────────────────

  async process(input: ProcessKnowledgeInput): Promise<ServiceResult<ProcessKnowledgeSuccess>> {
    return serverPost("/api/pipeline/process-knowledge", encodeContentForTransport({ ...input }));
  }

  async search(input: SearchKnowledgeInput): Promise<ServiceResult<SearchKnowledgeSuccess>> {
    return serverPost("/api/pipeline/search", input);
  }
}
