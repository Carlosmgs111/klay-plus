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
  // ── Cross-cutting ──────────────────────────────────────────────────

  async process(input: ProcessKnowledgeInput): Promise<ServiceResult<ProcessKnowledgeSuccess>> {
    return serverPost("/api/pipeline/process-knowledge", encodeContentForTransport({ ...input }));
  }

  async search(input: SearchKnowledgeInput): Promise<ServiceResult<SearchKnowledgeSuccess>> {
    return serverPost("/api/pipeline/search", input);
  }

  // ── Contexts ──────────────────────────────────────────────────────

  createContext(input: Parameters<KnowledgeService["createContext"]>[0]) {
    return serverPost("/api/lifecycle/create-context", input);
  }

  getContext(input: Parameters<KnowledgeService["getContext"]>[0]) {
    return serverGet(`/api/pipeline/contexts?id=${encodeURIComponent(input.contextId)}`);
  }

  listContexts() {
    return serverGet("/api/pipeline/contexts?summary=true");
  }

  listContextRefs() {
    return serverGet("/api/pipeline/contexts");
  }

  transitionContextState(input: Parameters<KnowledgeService["transitionContextState"]>[0]) {
    return serverPost("/api/lifecycle/transition-state", input);
  }

  updateContextProfile(input: Parameters<KnowledgeService["updateContextProfile"]>[0]) {
    return serverPost("/api/lifecycle/update-context-profile", input);
  }

  reconcileProjections(input: Parameters<KnowledgeService["reconcileProjections"]>[0]) {
    return serverPost("/api/lifecycle/reconcile-projections", input);
  }

  reconcileAllProfiles(input: Parameters<KnowledgeService["reconcileAllProfiles"]>[0]) {
    return serverPost("/api/lifecycle/reconcile-all-profiles", input);
  }

  removeSourceFromContext(input: Parameters<KnowledgeService["removeSourceFromContext"]>[0]) {
    return serverPost("/api/lifecycle/remove-source", input);
  }

  linkContexts(input: Parameters<KnowledgeService["linkContexts"]>[0]) {
    return serverPost("/api/lifecycle/link", input);
  }

  unlinkContexts(input: Parameters<KnowledgeService["unlinkContexts"]>[0]) {
    return serverPost("/api/lifecycle/unlink", input);
  }

  getContextLineage(input: Parameters<KnowledgeService["getContextLineage"]>[0]) {
    return serverPost("/api/lifecycle/get-lineage", input);
  }

  // ── Sources ──────────────────────────────────────────────────────

  listSources() {
    return serverGet("/api/pipeline/sources");
  }

  getSource(input: Parameters<KnowledgeService["getSource"]>[0]) {
    return serverGet(`/api/pipeline/sources/${input.sourceId}`);
  }

  getSourceContexts(input: Parameters<KnowledgeService["getSourceContexts"]>[0]) {
    return serverGet(`/api/pipeline/sources/${input.sourceId}/contexts`);
  }

  processSourceAllProfiles(input: Parameters<KnowledgeService["processSourceAllProfiles"]>[0]) {
    return serverPost("/api/lifecycle/process-source-all-profiles", input);
  }

  // ── Profiles ──────────────────────────────────────────────────────

  createProfile(input: Parameters<KnowledgeService["createProfile"]>[0]) {
    return serverPost("/api/pipeline/profiles", input);
  }

  listProfiles() {
    return serverGet("/api/pipeline/profiles");
  }

  updateProfile(input: Parameters<KnowledgeService["updateProfile"]>[0]) {
    return serverPut("/api/pipeline/profiles", input);
  }

  deprecateProfile(input: Parameters<KnowledgeService["deprecateProfile"]>[0]) {
    return serverPost("/api/pipeline/profiles/deprecate", input);
  }
}
