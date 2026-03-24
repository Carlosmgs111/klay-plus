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
 * Some entries are domain use cases (from contexts), others are
 * application-layer orchestrators (from application/).
 */
export interface KnowledgeApplication {
  /** Cross-context pipeline (vertical slice) */
  processKnowledge: ProcessKnowledge;

  contextManagement: {
    createContextAndActivate: CreateContextAndActivate;
    /** Application-layer composite: UpdateContextProfile + best-effort reconcile */
    updateContextProfileAndReconcile: UpdateProfileAndReconcile;
    transitionContextState: TransitionContextState;
    removeSourceFromContext: RemoveSourceFromContext;
    /** Pure domain queries (getRaw, listRefs, listBySource) */
    contextQueries: ContextQueries;
    /** Application-layer orchestrator */
    reconcileProjections: ReconcileProjections;
    /** Application-layer enriched read model (getDetail, listSummary) */
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
          input = {
            ...input,
            filters: { ...rest, sourceIds: [...sourceIds] },
          };
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

  // ── 1. Source ingestion (no cross-context deps) ────────────────────
  const { createSourceIngestion } = await import(
    "../../contexts/source-ingestion/composition/factory"
  );
  const source = await createSourceIngestion({
    provider: config.persistenceProvider,
    dbPath: config.dbPath,
    dbName: config.dbName,
    documentStorageProvider: config.documentStorageProvider,
    configOverrides: config.configOverrides,
    configStore: config.configStore,
  });

  // ── 2. Semantic processing (depends on source via port) ────────────
  const [
    { SourceIngestionAdapter },
    { createSemanticProcessing },
  ] = await Promise.all([
    import("../../contexts/semantic-processing/projection/infrastructure/adapters/SourceIngestionAdapter"),
    import("../../contexts/semantic-processing/composition/factory"),
  ]);

  const sourceIngestionAdapter = new SourceIngestionAdapter(source.sourceQueries);
  const semantic = await createSemanticProcessing({
    provider: config.persistenceProvider,
    dbPath: config.dbPath,
    dbName: config.dbName,
    embeddingDimensions: config.embeddingDimensions,
    embeddingProvider: config.embeddingProvider,
    embeddingModel: config.embeddingModel,
    vectorStoreProvider: config.vectorStoreProvider,
    defaultChunkingStrategy: config.defaultChunkingStrategy,
    configOverrides: config.configOverrides,
    configStore: config.configStore,
  }, sourceIngestionAdapter);

  // ── 3. Context management (pure domain — NO ports) ─────────────────
  const { createContextManagement } = await import(
    "../../contexts/context-management/composition/factory"
  );
  const context = await createContextManagement({
    provider: config.persistenceProvider,
    dbPath: config.dbPath,
    dbName: config.dbName,
  });

  // ── 4. Knowledge retrieval (pure search — NO ports) ────────────────
  const { createKnowledgeRetrieval } = await import(
    "../../contexts/knowledge-retrieval/composition/factory"
  );
  const retrieval = await createKnowledgeRetrieval({
    provider: config.persistenceProvider,
    vectorStoreProvider: config.vectorStoreProvider,
    vectorStoreConfig: semantic.vectorStoreConfig,
    embeddingDimensions: config.embeddingDimensions,
    embeddingProvider: config.embeddingProvider,
    embeddingModel: config.embeddingModel,
    retrieval: config.retrieval,
    configOverrides: config.configOverrides,
    configStore: config.configStore,
  });

  // ── 5. Application-layer adapters (cross-context bridges) ──────────
  const [
    { ProjectionOperationsAdapter },
    { SourceTextAdapter },
    { SourceMetadataAdapter },
    { ProjectionStatsAdapter },
    { ActiveProfilesAdapter },
    { ContextSourceAdapter },
  ] = await Promise.all([
    import("../adapters/ProjectionOperationsAdapter"),
    import("../adapters/SourceTextAdapter"),
    import("../adapters/SourceMetadataAdapter"),
    import("../adapters/ProjectionStatsAdapter"),
    import("../adapters/ActiveProfilesAdapter"),
    import("../adapters/ContextSourceAdapter"),
  ]);

  const projectionOperationsAdapter = new ProjectionOperationsAdapter(
    semantic.projectionQueries, semantic.cleanupProjections, semantic.generateProjection,
  );
  const sourceTextAdapter = new SourceTextAdapter(source.sourceQueries);
  const sourceMetadataAdapter = new SourceMetadataAdapter(source.sourceQueries);
  const projectionStatsAdapter = new ProjectionStatsAdapter(semantic.projectionQueries);
  const activeProfilesAdapter = new ActiveProfilesAdapter(semantic.profileQueries);

  // ── 6. Application-layer orchestrators ─────────────────────────────
  const [
    { ProcessKnowledge },
    { ReconcileProjections },
    { UpdateProfileAndReconcile },
    { ContextReadModel },
  ] = await Promise.all([
    import("../process-knowledge/ProcessKnowledge"),
    import("../reconcile-projections/ReconcileProjections"),
    import("../reconcile-projections/UpdateProfileAndReconcile"),
    import("../context-read-model/ContextReadModel"),
  ]);

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
    sourceText: sourceTextAdapter,
    activeProfiles: activeProfilesAdapter,
  });

  const updateProfileAndReconcile = new UpdateProfileAndReconcile({
    updateContextProfile: context.updateContextProfile,
    projectionOperations: projectionOperationsAdapter,
    sourceText: sourceTextAdapter,
  });

  const contextReadModel = new ContextReadModel({
    contextQueries: context.contextQueries,
    sourceMetadata: sourceMetadataAdapter,
    projectionStats: projectionStatsAdapter,
  });

  // ── 7. Return namespaced application ───────────────────────────────
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
      linkContexts: context.linkContexts,
      unlinkContexts: context.unlinkContexts,
      lineageQueries: context.lineageQueries,
    },

    sourceIngestion: {
      sourceQueries: source.sourceQueries,
    },

    semanticProcessing: {
      createProcessingProfile: semantic.createProcessingProfile,
      updateProcessingProfile: semantic.updateProcessingProfile,
      deprecateProcessingProfile: semantic.deprecateProcessingProfile,
      profileQueries: semantic.profileQueries,
      processSourceAllProfiles: semantic.processSourceAllProfiles,
    },

    knowledgeRetrieval: {
      // Wrap search with application-layer context resolution
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
