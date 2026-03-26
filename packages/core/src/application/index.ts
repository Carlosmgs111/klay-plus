/**
 * Application Layer — Public API of @klay/core
 *
 * Structure:
 * - process-knowledge/  — Cross-context pipeline workflow (vertical slice)
 * - composition/        — Dependency wiring (pure composition, no facade)
 * - dtos.ts             — Pure data contracts
 */

export type { KnowledgeApplication } from "./composition/knowledge.factory";

/** @deprecated Use `KnowledgeApplication` instead. */
export type { KnowledgeApplication as KnowledgePlatform } from "./composition/knowledge.factory";

/** @deprecated Use `KnowledgeApplication` instead. */
export type { KnowledgeApplication as KnowledgeCoordinator } from "./composition/knowledge.factory";

// ── Use-case types (for consumers typing namespace references) ──────
export type { CreateContextAndActivate } from "../contexts/context-management/context/application/use-cases/CreateContextAndActivate";
export type { UpdateProfileAndReconcile } from "./reconcile-projections/UpdateProfileAndReconcile";
/** @deprecated Use `UpdateProfileAndReconcile` instead. */
export type { UpdateProfileAndReconcile as UpdateContextProfileAndReconcile } from "./reconcile-projections/UpdateProfileAndReconcile";
export type { TransitionContextState } from "../contexts/context-management/context/application/use-cases/TransitionContextState";
export type { RemoveSourceFromContext } from "../contexts/context-management/context/application/use-cases/RemoveSourceFromContext";
export type { ContextQueries } from "../contexts/context-management/context/application/use-cases/ContextQueries";
export type { ReconcileProjections } from "./reconcile-projections/ReconcileProjections";
export type { GetContextDetail } from "../contexts/context-management/context/application/use-cases/GetContextDetail";
export type { ListContextSummary } from "../contexts/context-management/context/application/use-cases/ListContextSummary";
export type { LinkContexts } from "../contexts/context-management/lineage/application/use-cases/LinkContexts";
export type { UnlinkContexts } from "../contexts/context-management/lineage/application/use-cases/UnlinkContexts";
export type { LineageQueries } from "../contexts/context-management/lineage/application/use-cases/LineageQueries";
export type { SourceQueries } from "../contexts/source-ingestion/source/application/use-cases/SourceQueries";
export type { CreateProcessingProfile } from "../contexts/semantic-processing/processing-profile/application/use-cases/CreateProcessingProfile";
export type { UpdateProcessingProfile } from "../contexts/semantic-processing/processing-profile/application/use-cases/UpdateProcessingProfile";
export type { DeprecateProcessingProfile } from "../contexts/semantic-processing/processing-profile/application/use-cases/DeprecateProcessingProfile";
export type { ProfileQueries } from "../contexts/semantic-processing/processing-profile/application/use-cases/ProfileQueries";
export type { ProcessSourceAllProfiles } from "../contexts/semantic-processing/projection/application/use-cases/ProcessSourceAllProfiles";
export type { SearchKnowledge } from "../contexts/knowledge-retrieval/semantic-query/application/use-cases/SearchKnowledge";
export type { ProcessKnowledge } from "./process-knowledge/ProcessKnowledge";

// ── ProcessKnowledge DTOs ────────────────────────────────────────────
export type {
  ProcessKnowledgeInput,
  ProcessKnowledgeSuccess,
} from "./process-knowledge/dtos";

export type { PipelineError } from "./process-knowledge/boundary";

// ── Search DTOs ──────────────────────────────────────────────────────
export type {
  SearchKnowledgeInput,
  SearchKnowledgeSuccess,
} from "./dtos";

// ── Profile DTOs ─────────────────────────────────────────────────────
export type {
  CreateProcessingProfileInput,
  CreateProcessingProfileSuccess,
  ListProfilesResult,
  UpdateProfileInput,
  UpdateProfileResult,
  DeprecateProfileInput,
  DeprecateProfileResult,
} from "./dtos";

// ── Source DTOs ──────────────────────────────────────────────────────
export type {
  SourceSummaryDTO,
  ListSourcesResult,
  GetSourceInput,
  SourceDetailDTO,
  GetSourceResult,
  GetSourceContextsInput,
  ContextRefDTO,
  GetSourceContextsResult,
  ListContextsResult,
} from "./dtos";

// ── Context Details DTOs ─────────────────────────────────────────────
export type {
  GetContextDetailsInput,
  GetContextDetailsResult,
  ContextSourceDetailDTO,
  ProjectionSummaryDTO,
  ContextVersionDTO,
  EnrichedContextSummaryDTO,
  ListContextsSummaryResult,
} from "./dtos";

// ── Lifecycle DTOs ───────────────────────────────────────────────────
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

// ── Factory ──────────────────────────────────────────────────────────
export { createKnowledgeApplication, createKnowledgePlatform } from "./composition/knowledge.factory";

// ── Shared types ─────────────────────────────────────────────────────
export type { OrchestratorPolicy } from "./composition/OrchestratorPolicy";
