/**
 * Knowledge — Unified Coordinator Module
 *
 * Runtime-agnostic application service that coordinates all 4 bounded contexts
 * into a unified knowledge platform.
 *
 * Public API:
 * - KnowledgeCoordinator: the single entry point (class = contract)
 * - DTOs: input/output contracts (pipeline + lifecycle)
 * - KnowledgeError: error with operation step tracking
 * - OperationStep: enum of all operation stages
 * - createKnowledgePlatform(): factory function
 */

export { KnowledgeCoordinator } from "./KnowledgeCoordinator";
export type { ResolvedDependencies, ContextOperations, SourceOperations, ProfileOperations } from "./KnowledgeCoordinator";

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
export { createKnowledgePlatform } from "./composition/knowledge.factory";

// ── Shared types ─────────────────────────────────────────────────────
export type { OrchestratorPolicy } from "../composition/OrchestratorPolicy";
