import type { OrchestratorPolicy } from "./OrchestratorPolicy";
import type { ProcessKnowledge } from "../process-knowledge/ProcessKnowledge";
import type { ReconcileProjections } from "../../contexts/context-management/context/application/use-cases/ReconcileProjections";
import type { UpdateProfileAndReconcile } from "../../contexts/context-management/context/application/use-cases/UpdateProfileAndReconcile";
import type { ContextQueries } from "../../contexts/context-management/context/application/use-cases/ContextQueries";
import type { GetContextDetail } from "../../contexts/context-management/context/application/use-cases/GetContextDetail";
import type { ListContextSummary } from "../../contexts/context-management/context/application/use-cases/ListContextSummary";
import type { CreateContextAndActivate } from "../../contexts/context-management/context/application/use-cases/CreateContextAndActivate";
import type { TransitionContextState } from "../../contexts/context-management/context/application/use-cases/TransitionContextState";
import type { RemoveSourceFromContext } from "../../contexts/context-management/context/application/use-cases/RemoveSourceFromContext";
import type { LinkContexts } from "../../contexts/context-management/lineage/application/use-cases/LinkContexts";
import type { UnlinkContexts } from "../../contexts/context-management/lineage/application/use-cases/UnlinkContexts";
import type { LineageQueries } from "../../contexts/context-management/lineage/application/use-cases/LineageQueries";
import type { SourceQueries } from "../../contexts/source-ingestion/source/application/use-cases/SourceQueries";
import type { CreateProcessingProfile } from "../../contexts/semantic-processing/processing-profile/application/use-cases/CreateProcessingProfile";
import type { UpdateProcessingProfile } from "../../contexts/semantic-processing/processing-profile/application/use-cases/UpdateProcessingProfile";
import type { DeprecateProcessingProfile } from "../../contexts/semantic-processing/processing-profile/application/use-cases/DeprecateProcessingProfile";
import type { ProfileQueries } from "../../contexts/semantic-processing/processing-profile/application/use-cases/ProfileQueries";
import type { ProcessSourceAllProfiles } from "../../contexts/semantic-processing/projection/application/use-cases/ProcessSourceAllProfiles";
import type { SearchKnowledge } from "../../contexts/knowledge-retrieval/semantic-query/application/use-cases/SearchKnowledge";
import type { SearchKnowledgeInput } from "../dtos";

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

// ── Dependency resolver ──────────────────────────────────────────────

async function resolveDependencies(
  policy: OrchestratorPolicy,
): Promise<KnowledgeApplication> {
  const { resolveConfig } = await import("./resolvePlatformDependencies");
  const config = await resolveConfig(policy);

  // ── 1. Core wiring — all contexts resolved ─────────────────────────
  const { coreWiring } = await import("../../contexts");
  const core = await coreWiring({
    contextManagementInfrastructurePolicy: {
      contextInfrastructurePolicy: { provider: config.persistenceProvider, dbPath: config.dbPath, dbName: config.dbName },
      lineageInfrastructurePolicy: { provider: config.persistenceProvider, dbPath: config.dbPath, dbName: config.dbName },
    },
    sourceIngestionInfrastructurePolicy: {
      sourceInfrastructurePolicy: { provider: config.persistenceProvider, dbPath: config.dbPath, dbName: config.dbName },
      resourceInfrastructurePolicy: { provider: config.documentStorageProvider ?? config.persistenceProvider, dbPath: config.dbPath, dbName: config.dbName },
      extractionInfrastructurePolicy: { provider: config.persistenceProvider, dbPath: config.dbPath, dbName: config.dbName },
    },
    semanticProcessingInfrastructurePolicy: {
      projectionInfrastructurePolicy: {
        provider: config.persistenceProvider,
        dbPath: config.dbPath,
        dbName: config.dbName,
        embeddingDimensions: config.embeddingDimensions,
        embeddingProvider: config.embeddingProvider,
        embeddingModel: config.embeddingModel,
        vectorStoreProvider: config.vectorStoreProvider,
        configOverrides: config.configOverrides,
        configStore: config.configStore,
      },
      processingProfileInfrastructurePolicy: { provider: config.persistenceProvider, dbPath: config.dbPath, dbName: config.dbName },
    },
    knowledgeRetrievalInfrastructurePolicy: {
      semanticQueryInfrastructurePolicy: {
        provider: config.persistenceProvider,
        vectorStoreConfig: {}, // overridden by coreWiring from semantic-processing
        embeddingDimensions: config.embeddingDimensions,
        embeddingProvider: config.embeddingProvider,
        embeddingModel: config.embeddingModel,
        vectorStoreProvider: config.vectorStoreProvider,
        retrieval: config.retrieval,
        configOverrides: config.configOverrides,
        configStore: config.configStore,
      },
    },
  });

  // ── 2. Unpack wiring results ───────────────────────────────────────
  const { contextWiringResult: context, lineageWiringResult: lineage } =
    core.contextManagementWiringResult;
  const { sourceWiringResult: source } = core.sourceIngestionWiringResult;
  const { projectionWiringResult: projection, processingProfileWiringResult: profile } =
    core.semanticProcessingWiringResult;
  const { semanticQueryWiringResult: retrieval } =
    core.knowledgeRetrievalWiringResult;

  // ── 3. ProcessKnowledge (cross-context vertical slice) ──────────
  const { ProcessKnowledge } = await import("../process-knowledge/ProcessKnowledge");

  const processKnowledge = new ProcessKnowledge({
    ingestAndExtract: source.ingestAndExtract,
    sourceQueries: source.sourceQueries,
    projectionOperations: projection.projectionOperations,
    contextQueries: context.contextQueries,
    addSourceToContext: context.addSourceToContext,
  });

  // ── 4. Search with context filter (application-layer concern) ──────
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

  // ── 5. Return namespaced application ───────────────────────────────
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

// ── Public factory ──────────────────────────────────────────────────

export const createKnowledgeApplication = resolveDependencies;

/** @deprecated Use createKnowledgeApplication() */
export const createKnowledgePlatform = createKnowledgeApplication;
