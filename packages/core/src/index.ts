/**
 * @klay/core — Public API
 *
 * Factory + type exports. No logic.
 */

// ── Factory ─────────────────────────────────────────────────────────

export { createKnowledgeApplication, createKnowledgePlatform } from "./composition/root";

// ── KnowledgeApplication interface ──────────────────────────────────

import type { ProcessKnowledge } from "./pipelines/process-knowledge/ProcessKnowledge";
import type { ReconcileProjections } from "./contexts/context-management/context/application/use-cases/ReconcileProjections";
import type { UpdateProfileAndReconcile } from "./contexts/context-management/context/application/use-cases/UpdateProfileAndReconcile";
import type { ContextQueries } from "./contexts/context-management/context/application/use-cases/ContextQueries";
import type { GetContextDetail } from "./contexts/context-management/context/application/use-cases/GetContextDetail";
import type { ListContextSummary } from "./contexts/context-management/context/application/use-cases/ListContextSummary";
import type { CreateContextAndActivate } from "./contexts/context-management/context/application/use-cases/CreateContextAndActivate";
import type { TransitionContextState } from "./contexts/context-management/context/application/use-cases/TransitionContextState";
import type { RemoveSourceFromContext } from "./contexts/context-management/context/application/use-cases/RemoveSourceFromContext";
import type { LinkContexts } from "./contexts/context-management/lineage/application/use-cases/LinkContexts";
import type { UnlinkContexts } from "./contexts/context-management/lineage/application/use-cases/UnlinkContexts";
import type { LineageQueries } from "./contexts/context-management/lineage/application/use-cases/LineageQueries";
import type { SourceQueries } from "./contexts/source-ingestion/source/application/use-cases/SourceQueries";
import type { CreateProcessingProfile } from "./contexts/semantic-processing/processing-profile/application/use-cases/CreateProcessingProfile";
import type { UpdateProcessingProfile } from "./contexts/semantic-processing/processing-profile/application/use-cases/UpdateProcessingProfile";
import type { DeprecateProcessingProfile } from "./contexts/semantic-processing/processing-profile/application/use-cases/DeprecateProcessingProfile";
import type { ProfileQueries } from "./contexts/semantic-processing/processing-profile/application/use-cases/ProfileQueries";
import type { ProcessSourceAllProfiles } from "./contexts/semantic-processing/projection/application/use-cases/ProcessSourceAllProfiles";
import type { SearchKnowledge } from "./contexts/knowledge-retrieval/semantic-query/application/use-cases/SearchKnowledge";

export interface KnowledgeApplication {
  processKnowledge: ProcessKnowledge;
  contextManagement: {
    createContextAndActivate: CreateContextAndActivate;
    updateContextProfileAndReconcile: UpdateProfileAndReconcile;
    transitionContextState: TransitionContextState;
    removeSourceFromContext: RemoveSourceFromContext;
    contextQueries: ContextQueries;
    reconcileProjections: ReconcileProjections;
    getContextDetail: GetContextDetail;
    listContextSummary: ListContextSummary;
    linkContexts: LinkContexts;
    unlinkContexts: UnlinkContexts;
    lineageQueries: LineageQueries;
  };
  sourceIngestion: { sourceQueries: SourceQueries };
  semanticProcessing: {
    createProcessingProfile: CreateProcessingProfile;
    updateProcessingProfile: UpdateProcessingProfile;
    deprecateProcessingProfile: DeprecateProcessingProfile;
    profileQueries: ProfileQueries;
    processSourceAllProfiles: ProcessSourceAllProfiles;
  };
  knowledgeRetrieval: { searchKnowledge: SearchKnowledge };
}

/** @deprecated */ export type KnowledgePlatform = KnowledgeApplication;
/** @deprecated */ export type KnowledgeCoordinator = KnowledgeApplication;

// ── Type re-exports ─────────────────────────────────────────────────

export type { OrchestratorPolicy } from "./config/OrchestratorPolicy";
export type { ProcessKnowledge } from "./pipelines/process-knowledge/ProcessKnowledge";
export type { ProcessKnowledgeInput, ProcessKnowledgeSuccess } from "./pipelines/process-knowledge/dtos";
export type { PipelineError } from "./pipelines/process-knowledge/boundary";

// Context-management types
export type { CreateContextAndActivate, UpdateProfileAndReconcile, ReconcileProjections, GetContextDetail, ListContextSummary };
/** @deprecated */ export type { UpdateProfileAndReconcile as UpdateContextProfileAndReconcile } from "./contexts/context-management/context/application/use-cases/UpdateProfileAndReconcile";
export type { TransitionContextState, RemoveSourceFromContext, ContextQueries, LinkContexts, UnlinkContexts, LineageQueries };

// Source-ingestion types
export type { SourceQueries };

// Semantic-processing types
export type { CreateProcessingProfile, UpdateProcessingProfile, DeprecateProcessingProfile, ProfileQueries, ProcessSourceAllProfiles };

// Knowledge-retrieval types
export type { SearchKnowledge };

// ── DTO re-exports (from contexts) ──────────────────────────────────

export type {
  SearchKnowledgeInput, SearchKnowledgeSuccess,
} from "./contexts/knowledge-retrieval/dtos";

export type {
  CreateProcessingProfileInput, CreateProcessingProfileSuccess,
  ListProfilesResult, UpdateProfileInput, UpdateProfileResult,
  DeprecateProfileInput, DeprecateProfileResult,
  ProcessSourceAllProfilesInput, ProcessSourceAllProfilesResult,
} from "./contexts/semantic-processing/dtos";

export type {
  SourceSummaryDTO, ListSourcesResult, GetSourceInput,
  SourceDetailDTO, GetSourceResult,
} from "./contexts/source-ingestion/dtos";

export type {
  GetContextDetailsInput, GetContextDetailsResult,
  ContextSourceDetailDTO, ProjectionSummaryDTO, ContextVersionDTO,
  EnrichedContextSummaryDTO, ListContextsSummaryResult,
  ContextRefDTO, GetSourceContextsResult, ListContextsResult,
  RemoveSourceInput, RemoveSourceResult,
  ReconcileProjectionsInput, ReconcileProjectionsResult,
  ReconcileAllProfilesInput, ReconcileAllProfilesResult,
  LinkContextsInput, LinkContextsResult,
  UnlinkContextsInput, UnlinkContextsResult,
  CreateContextInput, CreateContextResult,
  GetContextLineageInput, GetContextLineageResult,
  UpdateContextProfileInput, UpdateContextProfileResult,
  TransitionContextStateInput, TransitionContextStateResult,
  GetSourceContextsInput,
} from "./contexts/context-management/dtos";
