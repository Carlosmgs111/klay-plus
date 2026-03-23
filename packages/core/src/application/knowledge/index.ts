/**
 * Knowledge — Unified Application Module
 *
 * Runtime-agnostic application layer coordinating all 4 bounded contexts.
 *
 * Structure:
 * - orchestrators/  — Multi-step coordination (ProcessKnowledge, CreateContextAndActivate, etc.)
 * - composition/    — Dependency wiring (resolveDependencies, createKnowledgeApplication)
 * - boundary/       — DTO mapping + error wrapping for web consumers
 * - domain/         — KnowledgeError, OperationStep
 * - dtos.ts         — Pure data contracts
 */

export type { KnowledgeApplication, ResolvedDependencies } from "./composition/knowledge.factory";

/** @deprecated Use `KnowledgeApplication` instead. */
export type { KnowledgeApplication as KnowledgePlatform } from "./composition/knowledge.factory";

/** @deprecated Use `KnowledgeApplication` instead. */
export type { KnowledgeApplication as KnowledgeCoordinator } from "./composition/knowledge.factory";

// ── Pipeline DTOs ──────────────────────────────────────────────────
export type {
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
  SourceSummaryDTO,
  ListSourcesResult,
  ListContextsResult,
  GetSourceInput,
  SourceDetailDTO,
  GetSourceResult,
  GetSourceContextsInput,
  ContextRefDTO,
  GetSourceContextsResult,
} from "./dtos";

// ── Context Details DTOs (replaces manifest) ────────────────────────
export type {
  GetContextDetailsInput,
  GetContextDetailsResult,
  ContextSourceDetailDTO,
  ProjectionSummaryDTO,
  ContextVersionDTO,
  EnrichedContextSummaryDTO,
  ListContextsSummaryResult,
} from "./dtos";

// ── Lifecycle DTOs ──────────────────────────────────────────────────
export type {
  RemoveSourceInput,
  RemoveSourceResult,
  ReconcileProjectionsInput,
  ReconcileProjectionsResult,
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
  ReconcileAllProfilesInput,
  ReconcileAllProfilesResult,
  ProcessSourceAllProfilesInput,
  ProcessSourceAllProfilesResult,
} from "./dtos";

// ── Domain ──────────────────────────────────────────────────────────
export { KnowledgeError } from "./domain/KnowledgeError";
export { OperationStep } from "./domain/OperationStep";
export type { OperationStep as OperationStepType } from "./domain/OperationStep";

// ── Factory ──────────────────────────────────────────────────────────
export { createKnowledgeApplication, createKnowledgePlatform } from "./composition/knowledge.factory";

// ── Boundary: DTO Mapping Utilities ─────────────────────────────────
export {
  mapSourcesToDTO,
  mapSourceToDetailDTO,
  mapProfilesToDTO,
  mapTransitionResult,
  mapRemoveSourceResult,
  mapLinkResult,
  mapUnlinkResult,
  mapLineageResult,
  mapCreateProfileResult,
  mapUpdateProfileResult,
  mapDeprecateProfileResult,
  mapTransitionInput,
} from "./boundary/mappers";

// ── Boundary: Execute Functions ─────────────────────────────────────
export {
  executeTransitionContextState,
  executeRemoveSource,
  executeLinkContexts,
  executeUnlinkContexts,
  executeGetContextLineage,
  executeListSources,
  executeGetSource,
  executeCreateProfile,
  executeListProfiles,
  executeUpdateProfile,
  executeDeprecateProfile,
} from "./boundary/executors";

// ── Shared types ─────────────────────────────────────────────────────
export type { OrchestratorPolicy } from "../composition/OrchestratorPolicy";
