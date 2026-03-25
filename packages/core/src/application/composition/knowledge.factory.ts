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

/**
 * KnowledgeApplication — pure composition, no facade.
 *
 * Exposes use cases grouped by bounded context namespace.
 * Some entries are domain use cases (from module wirings), others are
 * application-layer orchestrators (from application/).
 */
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

  const persistenceConfig = { provider: config.persistenceProvider, dbPath: config.dbPath, dbName: config.dbName };

  // ── 1. Independent module wirings (parallel) ───────────────────────
  const [
    { extractionWiring },
    { resourceWiring },
    { processingProfileWiring },
    { contextWiring },
    { lineageWiring },
  ] = await Promise.all([
    import("../../contexts/source-ingestion/extraction/composition/wiring"),
    import("../../contexts/source-ingestion/resource/composition/wiring"),
    import("../../contexts/semantic-processing/processing-profile/composition/wiring"),
    import("../../contexts/context-management/context/composition/wiring"),
    import("../../contexts/context-management/lineage/composition/wiring"),
  ]);

  const [extraction, resource, profile, context, lineage] = await Promise.all([
    extractionWiring(persistenceConfig),
    resourceWiring({
      ...persistenceConfig,
      provider: config.documentStorageProvider ?? config.persistenceProvider,
    }),
    processingProfileWiring(persistenceConfig),
    contextWiring(persistenceConfig),
    lineageWiring(persistenceConfig),
  ]);

  // ── 2. Source wiring (depends on extraction + resource) ──────────────
  const { sourceWiring } = await import(
    "../../contexts/source-ingestion/source/composition/wiring"
  );
  const source = await sourceWiring(persistenceConfig, {
    executeExtraction: extraction.executeExtraction,
    extractionJobRepository: extraction.extractionJobRepository,
    storeResource: resource.storeResource,
    registerExternalResource: resource.registerExternalResource,
  });

  // ── 3. Projection wiring (depends on profile + source via port) ────
  const [
    { projectionWiring },
    { SourceIngestionAdapter },
  ] = await Promise.all([
    import("../../contexts/semantic-processing/projection/composition/wiring"),
    import("../../contexts/semantic-processing/projection/infrastructure/adapters/SourceIngestionAdapter"),
  ]);
  const projection = await projectionWiring(
    {
      ...persistenceConfig,
      embeddingDimensions: config.embeddingDimensions,
      embeddingProvider: config.embeddingProvider,
      embeddingModel: config.embeddingModel,
      vectorStoreProvider: config.vectorStoreProvider,
      configOverrides: config.configOverrides,
      configStore: config.configStore,
    },
    {
      profileRepository: profile.profileRepository,
      profileQueries: profile.profileQueries,
      sourceIngestionPort: new SourceIngestionAdapter(source.sourceQueries),
    },
  );

  // ── 4. Knowledge retrieval ─────────────────────────────────────────
  const { semanticQueryWiring } = await import(
    "../../contexts/knowledge-retrieval/semantic-query/composition/wiring"
  );
  const retrieval = await semanticQueryWiring({
    provider: config.persistenceProvider,
    vectorStoreProvider: config.vectorStoreProvider,
    vectorStoreConfig: projection.vectorStoreConfig,
    embeddingDimensions: config.embeddingDimensions,
    embeddingProvider: config.embeddingProvider,
    embeddingModel: config.embeddingModel,
    retrieval: config.retrieval,
    configOverrides: config.configOverrides,
    configStore: config.configStore,
  });

  // ── 5. Application-layer adapters + orchestrators ──────────────────
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

  // ── 6. Return namespaced application ───────────────────────────────
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
