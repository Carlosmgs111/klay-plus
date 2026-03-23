import type { ServiceResult } from "./types";
import type {
  ProcessKnowledgeInput,
  ProcessKnowledgeSuccess,
  SearchKnowledgeInput,
  SearchKnowledgeSuccess,
  CreateProcessingProfileInput,
  CreateProcessingProfileSuccess,
  ListProfilesResult,
  UpdateProfileInput,
  UpdateProfileResult,
  DeprecateProfileInput,
  DeprecateProfileResult,
  GetContextDetailsInput,
  GetContextDetailsResult,
  ListContextsSummaryResult,
  ListSourcesResult,
  ListContextsResult,
  GetSourceInput,
  GetSourceResult,
  GetSourceContextsInput,
  GetSourceContextsResult,
  RemoveSourceInput,
  RemoveSourceResult,
  ReconcileProjectionsInput,
  ReconcileProjectionsResult,
  ReconcileAllProfilesInput,
  ReconcileAllProfilesResult,
  ProcessSourceAllProfilesInput,
  ProcessSourceAllProfilesResult,
  LinkContextsInput,
  LinkContextsResult,
  UnlinkContextsInput,
  UnlinkContextsResult,
  CreateContextInput,
  CreateContextResult,
  GetContextLineageInput,
  GetContextLineageResult,
  UpdateContextProfileInput,
  UpdateContextProfileResult,
  TransitionContextStateInput,
  TransitionContextStateResult,
} from "@klay/core";

/**
 * KnowledgeService — runtime-agnostic interface for all knowledge operations.
 *
 * Flat method surface matching KnowledgeCoordinator:
 * - Context operations: createContext, getContext, listContexts, listContextRefs,
 *   transitionContextState, updateContextProfile, reconcileProjections,
 *   reconcileAllProfiles, removeSourceFromContext, linkContexts, unlinkContexts,
 *   getContextLineage
 * - Source operations: listSources, getSource, getSourceContexts, processSourceAllProfiles
 * - Profile operations: createProfile, listProfiles, updateProfile, deprecateProfile
 * - Cross-cutting: process(), search()
 *
 * Implemented by:
 * - ServerKnowledgeService (fetches /api/* routes)
 * - BrowserKnowledgeService (calls KnowledgeCoordinator directly)
 */
export interface KnowledgeService {
  // ── Cross-cutting ──────────────────────────────────────────────────

  process(
    input: ProcessKnowledgeInput,
  ): Promise<ServiceResult<ProcessKnowledgeSuccess>>;

  search(
    input: SearchKnowledgeInput,
  ): Promise<ServiceResult<SearchKnowledgeSuccess>>;

  // ── Contexts ───────────────────────────────────────────────────────

  createContext(input: CreateContextInput): Promise<ServiceResult<CreateContextResult>>;
  getContext(input: GetContextDetailsInput): Promise<ServiceResult<GetContextDetailsResult>>;
  listContexts(): Promise<ServiceResult<ListContextsSummaryResult>>;
  listContextRefs(): Promise<ServiceResult<ListContextsResult>>;
  transitionContextState(input: TransitionContextStateInput): Promise<ServiceResult<TransitionContextStateResult>>;
  updateContextProfile(input: UpdateContextProfileInput): Promise<ServiceResult<UpdateContextProfileResult>>;
  reconcileProjections(input: ReconcileProjectionsInput): Promise<ServiceResult<ReconcileProjectionsResult>>;
  reconcileAllProfiles(input: ReconcileAllProfilesInput): Promise<ServiceResult<ReconcileAllProfilesResult>>;
  removeSourceFromContext(input: RemoveSourceInput): Promise<ServiceResult<RemoveSourceResult>>;
  linkContexts(input: LinkContextsInput): Promise<ServiceResult<LinkContextsResult>>;
  unlinkContexts(input: UnlinkContextsInput): Promise<ServiceResult<UnlinkContextsResult>>;
  getContextLineage(input: GetContextLineageInput): Promise<ServiceResult<GetContextLineageResult>>;

  // ── Sources ────────────────────────────────────────────────────────

  listSources(): Promise<ServiceResult<ListSourcesResult>>;
  getSource(input: GetSourceInput): Promise<ServiceResult<GetSourceResult>>;
  getSourceContexts(input: GetSourceContextsInput): Promise<ServiceResult<GetSourceContextsResult>>;
  processSourceAllProfiles(input: ProcessSourceAllProfilesInput): Promise<ServiceResult<ProcessSourceAllProfilesResult>>;

  // ── Profiles ───────────────────────────────────────────────────────

  createProfile(input: CreateProcessingProfileInput): Promise<ServiceResult<CreateProcessingProfileSuccess>>;
  listProfiles(): Promise<ServiceResult<ListProfilesResult>>;
  updateProfile(input: UpdateProfileInput): Promise<ServiceResult<UpdateProfileResult>>;
  deprecateProfile(input: DeprecateProfileInput): Promise<ServiceResult<DeprecateProfileResult>>;
}
