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
 * Organized by resource namespace:
 * - service.contexts.*  — context lifecycle & queries
 * - service.sources.*   — source library
 * - service.profiles.*  — processing profiles
 * - service.process()   — onboarding pipeline
 * - service.search()    — semantic query
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

  readonly contexts: {
    create(input: CreateContextInput): Promise<ServiceResult<CreateContextResult>>;
    get(input: GetContextDetailsInput): Promise<ServiceResult<GetContextDetailsResult>>;
    list(): Promise<ServiceResult<ListContextsSummaryResult>>;
    listRefs(): Promise<ServiceResult<ListContextsResult>>;
    transitionState(input: TransitionContextStateInput): Promise<ServiceResult<TransitionContextStateResult>>;
    updateProfile(input: UpdateContextProfileInput): Promise<ServiceResult<UpdateContextProfileResult>>;
    reconcileProjections(input: ReconcileProjectionsInput): Promise<ServiceResult<ReconcileProjectionsResult>>;
    reconcileAllProfiles(input: ReconcileAllProfilesInput): Promise<ServiceResult<ReconcileAllProfilesResult>>;
    removeSource(input: RemoveSourceInput): Promise<ServiceResult<RemoveSourceResult>>;
    link(input: LinkContextsInput): Promise<ServiceResult<LinkContextsResult>>;
    unlink(input: UnlinkContextsInput): Promise<ServiceResult<UnlinkContextsResult>>;
    getLineage(input: GetContextLineageInput): Promise<ServiceResult<GetContextLineageResult>>;
  };

  // ── Sources ────────────────────────────────────────────────────────

  readonly sources: {
    list(): Promise<ServiceResult<ListSourcesResult>>;
    get(input: GetSourceInput): Promise<ServiceResult<GetSourceResult>>;
    getContexts(input: GetSourceContextsInput): Promise<ServiceResult<GetSourceContextsResult>>;
    processAllProfiles(input: ProcessSourceAllProfilesInput): Promise<ServiceResult<ProcessSourceAllProfilesResult>>;
  };

  // ── Profiles ───────────────────────────────────────────────────────

  readonly profiles: {
    create(input: CreateProcessingProfileInput): Promise<ServiceResult<CreateProcessingProfileSuccess>>;
    list(): Promise<ServiceResult<ListProfilesResult>>;
    update(input: UpdateProfileInput): Promise<ServiceResult<UpdateProfileResult>>;
    deprecate(input: DeprecateProfileInput): Promise<ServiceResult<DeprecateProfileResult>>;
  };
}
