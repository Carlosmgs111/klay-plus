import type { OrchestratorPolicy } from "./OrchestratorPolicy";
import type { ProcessKnowledge } from "../process-knowledge/ProcessKnowledge";
import type { ReconcileProjections } from "../reconcile-projections/ReconcileProjections";
import type { UpdateProfileAndReconcile } from "../reconcile-projections/UpdateProfileAndReconcile";
import type { ContextReadModel } from "../context-read-model/ContextReadModel";
import type { ContextQueries } from "../../contexts/context-management/context/application/use-cases/ContextQueries";
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

export interface KnowledgeApplication {
  processKnowledge: ProcessKnowledge;

  contextManagement: {
    createContextAndActivate: CreateContextAndActivate;
    updateContextProfileAndReconcile: UpdateProfileAndReconcile;
    transitionContextState: TransitionContextState;
    removeSourceFromContext: RemoveSourceFromContext;
    contextQueries: ContextQueries;
    reconcileProjections: ReconcileProjections;
    contextReadModel: ContextReadModel;
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

// ── Search context resolution (application-layer concern) ────────────

import type { ContextSourcePort } from "../ports/ContextSourcePort";
import type { SearchKnowledgeInput } from "../dtos";

function wrapSearchWithContextFilter(
  searchKnowledge: SearchKnowledge,
  contextSource: ContextSourcePort,
): SearchKnowledge {
  return {
    async execute(input: SearchKnowledgeInput) {
      if (input.filters?.contextId) {
        const contextId = input.filters.contextId as string;
        const sourceIds = await contextSource.getActiveSourceIds(contextId);
        if (sourceIds) {
          const { contextId: _, ...rest } = input.filters;
          input = { ...input, filters: { ...rest, sourceIds: [...sourceIds] } };
        }
      }
      return searchKnowledge.execute(input);
    },
  } as SearchKnowledge;
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

  // ── 3. Application-layer orchestrators ─────────────────────────────
  const [
    { ProjectionOperationsAdapter },
    { SourceTextAdapter },
    { SourceMetadataAdapter },
    { ProjectionStatsAdapter },
    { ActiveProfilesAdapter },
    { ContextSourceAdapter },
    { ProcessKnowledge },
    { ReconcileProjections },
    { UpdateProfileAndReconcile },
    { ContextReadModel },
  ] = await Promise.all([
    import("../adapters/ProjectionOperationsAdapter"),
    import("../adapters/SourceTextAdapter"),
    import("../adapters/SourceMetadataAdapter"),
    import("../adapters/ProjectionStatsAdapter"),
    import("../adapters/ActiveProfilesAdapter"),
    import("../adapters/ContextSourceAdapter"),
    import("../process-knowledge/ProcessKnowledge"),
    import("../reconcile-projections/ReconcileProjections"),
    import("../reconcile-projections/UpdateProfileAndReconcile"),
    import("../context-read-model/ContextReadModel"),
  ]);

  const projectionOperationsAdapter = new ProjectionOperationsAdapter(
    projection.projectionQueries, projection.cleanupProjections, projection.generateProjection,
  );

  const processKnowledge = new ProcessKnowledge({
    ingestAndExtract: source.ingestAndExtract,
    sourceQueries: source.sourceQueries,
    projectionOperations: projectionOperationsAdapter,
    contextQueries: context.contextQueries,
    addSourceToContext: context.addSourceToContext,
  });

  const reconcileProjections = new ReconcileProjections({
    contextQueries: context.contextQueries,
    projectionOperations: projectionOperationsAdapter,
    sourceText: new SourceTextAdapter(source.sourceQueries),
    activeProfiles: new ActiveProfilesAdapter(profile.profileQueries),
  });

  const updateProfileAndReconcile = new UpdateProfileAndReconcile({
    updateContextProfile: context.updateContextProfile,
    projectionOperations: projectionOperationsAdapter,
    sourceText: new SourceTextAdapter(source.sourceQueries),
  });

  const contextReadModel = new ContextReadModel({
    contextQueries: context.contextQueries,
    sourceMetadata: new SourceMetadataAdapter(source.sourceQueries),
    projectionStats: new ProjectionStatsAdapter(projection.projectionQueries),
  });

  // ── 4. Return namespaced application ───────────────────────────────
  return {
    processKnowledge,

    contextManagement: {
      createContextAndActivate: context.createContextAndActivate,
      updateContextProfileAndReconcile: updateProfileAndReconcile,
      transitionContextState: context.transitionContextState,
      removeSourceFromContext: context.removeSourceFromContext,
      contextQueries: context.contextQueries,
      reconcileProjections,
      contextReadModel,
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

    knowledgeRetrieval: {
      searchKnowledge: wrapSearchWithContextFilter(
        retrieval.searchKnowledge,
        new ContextSourceAdapter(context.contextRepository),
      ),
    },
  };
}

// ── Public factory ──────────────────────────────────────────────────

export const createKnowledgeApplication = resolveDependencies;

/** @deprecated Use createKnowledgeApplication() */
export const createKnowledgePlatform = createKnowledgeApplication;
