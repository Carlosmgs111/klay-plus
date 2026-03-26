/**
 * Application Layer — Public API of @klay/core
 *
 * Structure:
 * - process-knowledge/  — Cross-context pipeline (vertical slice)
 * - dtos.ts             — Pure data contracts
 * - index.ts            — Factory + type exports
 */

import type { ProcessKnowledge } from "./process-knowledge/ProcessKnowledge";
import type { ReconcileProjections } from "../contexts/context-management/context/application/use-cases/ReconcileProjections";
import type { UpdateProfileAndReconcile } from "../contexts/context-management/context/application/use-cases/UpdateProfileAndReconcile";
import type { ContextQueries } from "../contexts/context-management/context/application/use-cases/ContextQueries";
import type { GetContextDetail } from "../contexts/context-management/context/application/use-cases/GetContextDetail";
import type { ListContextSummary } from "../contexts/context-management/context/application/use-cases/ListContextSummary";
import type { CreateContextAndActivate } from "../contexts/context-management/context/application/use-cases/CreateContextAndActivate";
import type { TransitionContextState } from "../contexts/context-management/context/application/use-cases/TransitionContextState";
import type { RemoveSourceFromContext } from "../contexts/context-management/context/application/use-cases/RemoveSourceFromContext";
import type { LinkContexts } from "../contexts/context-management/lineage/application/use-cases/LinkContexts";
import type { UnlinkContexts } from "../contexts/context-management/lineage/application/use-cases/UnlinkContexts";
import type { LineageQueries } from "../contexts/context-management/lineage/application/use-cases/LineageQueries";
import type { SourceQueries } from "../contexts/source-ingestion/source/application/use-cases/SourceQueries";
import type { CreateProcessingProfile } from "../contexts/semantic-processing/processing-profile/application/use-cases/CreateProcessingProfile";
import type { UpdateProcessingProfile } from "../contexts/semantic-processing/processing-profile/application/use-cases/UpdateProcessingProfile";
import type { DeprecateProcessingProfile } from "../contexts/semantic-processing/processing-profile/application/use-cases/DeprecateProcessingProfile";
import type { ProfileQueries } from "../contexts/semantic-processing/processing-profile/application/use-cases/ProfileQueries";
import type { ProcessSourceAllProfiles } from "../contexts/semantic-processing/projection/application/use-cases/ProcessSourceAllProfiles";
import type { SearchKnowledge } from "../contexts/knowledge-retrieval/semantic-query/application/use-cases/SearchKnowledge";
import type { OrchestratorPolicy } from "../config/OrchestratorPolicy";
import type { SearchKnowledgeInput } from "./dtos";

// ── KnowledgeApplication interface ──────────────────────────────────

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

  sourceIngestion: {
    sourceQueries: SourceQueries;
  };

  semanticProcessing: {
    createProcessingProfile: CreateProcessingProfile;
    updateProcessingProfile: UpdateProcessingProfile;
    deprecateProcessingProfile: DeprecateProcessingProfile;
    profileQueries: ProfileQueries;
    processSourceAllProfiles: ProcessSourceAllProfiles;
  };

  knowledgeRetrieval: {
    searchKnowledge: SearchKnowledge;
  };
}

/** @deprecated Use `KnowledgeApplication` instead. */
export type KnowledgePlatform = KnowledgeApplication;
/** @deprecated Use `KnowledgeApplication` instead. */
export type KnowledgeCoordinator = KnowledgeApplication;

// ── Factory ─────────────────────────────────────────────────────────

export async function createKnowledgeApplication(
  policy: OrchestratorPolicy,
): Promise<KnowledgeApplication> {
  const { resolveConfig } = await import("../config/resolveConfig");
  const config = await resolveConfig(policy);

  const { coreWiring } = await import("../contexts");
  const core = await coreWiring(config);

  // Unpack wiring results
  const { contextWiringResult: context, lineageWiringResult: lineage } =
    core.contextManagementWiringResult;
  const { sourceWiringResult: source } = core.sourceIngestionWiringResult;
  const { projectionWiringResult: projection, processingProfileWiringResult: profile } =
    core.semanticProcessingWiringResult;
  const { semanticQueryWiringResult: retrieval } =
    core.knowledgeRetrievalWiringResult;

  // ProcessKnowledge — cross-context vertical slice
  const { ProcessKnowledge } = await import("./process-knowledge/ProcessKnowledge");
  const processKnowledge = new ProcessKnowledge({
    ingestAndExtract: source.ingestAndExtract,
    sourceQueries: source.sourceQueries,
    projectionOperations: projection.projectionOperations,
    contextQueries: context.contextQueries,
    addSourceToContext: context.addSourceToContext,
  });

  // Search with context filter
  const wrappedSearch = {
    async execute(input: SearchKnowledgeInput) {
      if (input.filters?.contextId) {
        const contextId = input.filters.contextId as string;
        const ctx = await context.contextQueries.getRaw(contextId);
        if (ctx) {
          const sourceIds = ctx.activeSources.map((s) => s.sourceId);
          const { contextId: _, ...rest } = input.filters;
          input = { ...input, filters: { ...rest, sourceIds } };
        }
      }
      return retrieval.searchKnowledge.execute(input);
    },
  } as SearchKnowledge;

  return {
    processKnowledge,

    contextManagement: {
      createContextAndActivate: context.createContextAndActivate,
      updateContextProfileAndReconcile: context.updateProfileAndReconcile,
      transitionContextState: context.transitionContextState,
      removeSourceFromContext: context.removeSourceFromContext,
      contextQueries: context.contextQueries,
      reconcileProjections: context.reconcileProjections,
      getContextDetail: context.getContextDetail,
      listContextSummary: context.listContextSummary,
      linkContexts: lineage.linkContexts,
      unlinkContexts: lineage.unlinkContexts,
      lineageQueries: lineage.lineageQueries,
    },

    sourceIngestion: { sourceQueries: source.sourceQueries },

    semanticProcessing: {
      createProcessingProfile: profile.createProcessingProfile,
      updateProcessingProfile: profile.updateProcessingProfile,
      deprecateProcessingProfile: profile.deprecateProcessingProfile,
      profileQueries: profile.profileQueries,
      processSourceAllProfiles: projection.processSourceAllProfiles,
    },

    knowledgeRetrieval: { searchKnowledge: wrappedSearch },
  };
}

/** @deprecated Use createKnowledgeApplication() */
export const createKnowledgePlatform = createKnowledgeApplication;

// ── Type re-exports ─────────────────────────────────────────────────

export type { ProcessKnowledge } from "./process-knowledge/ProcessKnowledge";
export type { CreateContextAndActivate } from "../contexts/context-management/context/application/use-cases/CreateContextAndActivate";
export type { UpdateProfileAndReconcile } from "../contexts/context-management/context/application/use-cases/UpdateProfileAndReconcile";
/** @deprecated Use `UpdateProfileAndReconcile` instead. */
export type { UpdateProfileAndReconcile as UpdateContextProfileAndReconcile } from "../contexts/context-management/context/application/use-cases/UpdateProfileAndReconcile";
export type { TransitionContextState } from "../contexts/context-management/context/application/use-cases/TransitionContextState";
export type { RemoveSourceFromContext } from "../contexts/context-management/context/application/use-cases/RemoveSourceFromContext";
export type { ContextQueries } from "../contexts/context-management/context/application/use-cases/ContextQueries";
export type { ReconcileProjections } from "../contexts/context-management/context/application/use-cases/ReconcileProjections";
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
export type { OrchestratorPolicy } from "../config/OrchestratorPolicy";

// ── DTO re-exports ──────────────────────────────────────────────────

export type { ProcessKnowledgeInput, ProcessKnowledgeSuccess } from "./process-knowledge/dtos";
export type { PipelineError } from "./process-knowledge/boundary";
export type {
  SearchKnowledgeInput, SearchKnowledgeSuccess,
  CreateProcessingProfileInput, CreateProcessingProfileSuccess,
  ListProfilesResult, UpdateProfileInput, UpdateProfileResult,
  DeprecateProfileInput, DeprecateProfileResult,
  SourceSummaryDTO, ListSourcesResult, GetSourceInput,
  SourceDetailDTO, GetSourceResult, GetSourceContextsInput,
  ContextRefDTO, GetSourceContextsResult, ListContextsResult,
  GetContextDetailsInput, GetContextDetailsResult,
  ContextSourceDetailDTO, ProjectionSummaryDTO, ContextVersionDTO,
  EnrichedContextSummaryDTO, ListContextsSummaryResult,
  RemoveSourceInput, RemoveSourceResult,
  ReconcileProjectionsInput, ReconcileProjectionsResult,
  LinkContextsInput, LinkContextsResult,
  UnlinkContextsInput, UnlinkContextsResult,
  CreateContextInput, CreateContextResult,
  GetContextLineageInput, GetContextLineageResult,
  UpdateContextProfileInput, UpdateContextProfileResult,
  TransitionContextStateInput, TransitionContextStateResult,
  ReconcileAllProfilesInput, ReconcileAllProfilesResult,
  ProcessSourceAllProfilesInput, ProcessSourceAllProfilesResult,
} from "./dtos";
