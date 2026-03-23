import type { OrchestratorPolicy } from "../../composition/OrchestratorPolicy";
import { ProcessKnowledge } from "../orchestrators/ProcessKnowledge";
import { CreateContextAndActivate } from "../orchestrators/CreateContextAndActivate";
import { UpdateContextProfileAndReconcile } from "../orchestrators/UpdateContextProfileAndReconcile";
import type { SourceQueries } from "../../../contexts/source-ingestion/source/application/use-cases/SourceQueries";
import type { CreateProcessingProfile } from "../../../contexts/semantic-processing/processing-profile/application/use-cases/CreateProcessingProfile";
import type { UpdateProcessingProfile } from "../../../contexts/semantic-processing/processing-profile/application/use-cases/UpdateProcessingProfile";
import type { DeprecateProcessingProfile } from "../../../contexts/semantic-processing/processing-profile/application/use-cases/DeprecateProcessingProfile";
import type { ProfileQueries } from "../../../contexts/semantic-processing/processing-profile/application/use-cases/ProfileQueries";
import type { CreateContext } from "../../../contexts/context-management/context/application/use-cases/CreateContext";
import type { AddSourceToContext } from "../../../contexts/context-management/context/application/use-cases/AddSourceToContext";
import type { RemoveSourceFromContext } from "../../../contexts/context-management/context/application/use-cases/RemoveSourceFromContext";
import type { TransitionContextState } from "../../../contexts/context-management/context/application/use-cases/TransitionContextState";
import type { UpdateContextProfile } from "../../../contexts/context-management/context/application/use-cases/UpdateContextProfile";
import type { ContextQueries } from "../../../contexts/context-management/context/application/use-cases/ContextQueries";
import type { ReconcileProjections as ReconcileProjectionsCM } from "../../../contexts/context-management/context/application/use-cases/ReconcileProjections";
import type { LinkContexts } from "../../../contexts/context-management/lineage/application/use-cases/LinkContexts";
import type { UnlinkContexts } from "../../../contexts/context-management/lineage/application/use-cases/UnlinkContexts";
import type { LineageQueries } from "../../../contexts/context-management/lineage/application/use-cases/LineageQueries";
import type { ProcessSourceAllProfiles } from "../../../contexts/semantic-processing/projection/application/use-cases/ProcessSourceAllProfiles";
import type { SearchKnowledge } from "../../../contexts/knowledge-retrieval/semantic-query/application/use-cases/SearchKnowledge";

// ── Resolved dependencies (internal) ─────────────────────────────────

export interface ResolvedDependencies {
  // Source Ingestion (consolidated query class)
  sourceQueries: SourceQueries;
  // Semantic Processing write use cases
  createProcessingProfile: CreateProcessingProfile;
  updateProcessingProfile: UpdateProcessingProfile;
  deprecateProcessingProfile: DeprecateProcessingProfile;
  // Semantic Processing read (consolidated query class)
  profileQueries: ProfileQueries;
  processKnowledge: ProcessKnowledge;
  // Context-management read (consolidated query class)
  contextQueries: ContextQueries;
  reconcileProjections: ReconcileProjectionsCM;
  processSourceAllProfiles: ProcessSourceAllProfiles;
  searchKnowledge: SearchKnowledge;
  // Context use cases (write)
  createContext: CreateContext;
  addSourceToContext: AddSourceToContext;
  removeSourceFromContext: RemoveSourceFromContext;
  transitionContextState: TransitionContextState;
  updateContextProfile: UpdateContextProfile;
  // Lineage use cases
  linkContexts: LinkContexts;
  unlinkContexts: UnlinkContexts;
  lineageQueries: LineageQueries;
}

// ── Public application type ──────────────────────────────────────────

/**
 * KnowledgeApplication — exposes all use cases directly + 3 orchestrators.
 *
 * Consumers call use cases directly (e.g. `app.processKnowledge.execute(input)`)
 * instead of going through a facade. Boundary functions (DTO mapping + error
 * wrapping) are in `boundary/` for web consumers that need them.
 */
export interface KnowledgeApplication extends ResolvedDependencies {
  createContextAndActivate: CreateContextAndActivate;
  updateContextProfileAndReconcile: UpdateContextProfileAndReconcile;
}

// ── Dependency resolver ──────────────────────────────────────────────

export async function resolveDependencies(
  policy: OrchestratorPolicy,
): Promise<ResolvedDependencies> {
  const { resolvePlatformDependencies } = await import(
    "../../composition/resolvePlatformDependencies"
  );

  // ── Platform: profile + projection + shared vector stores ─────────
  const platform = await resolvePlatformDependencies(policy);
  const {
    projectionInfra,
    profileRepository,
    profileEventPublisher,
    system,
    resolved: { persistenceProvider, documentStorageProvider },
  } = platform;

  const { repository: projectionRepository, materializer, eventPublisher: projectionEventPublisher } = projectionInfra;
  const { vectorStore } = system;

  // ── Processing-profile use cases ──────────────────────────────────
  const [
    { CreateProcessingProfile },
    { UpdateProcessingProfile },
    { DeprecateProcessingProfile },
    { ProfileQueries },
  ] = await Promise.all([
    import("../../../contexts/semantic-processing/processing-profile/application/use-cases/CreateProcessingProfile"),
    import("../../../contexts/semantic-processing/processing-profile/application/use-cases/UpdateProcessingProfile"),
    import("../../../contexts/semantic-processing/processing-profile/application/use-cases/DeprecateProcessingProfile"),
    import("../../../contexts/semantic-processing/processing-profile/application/use-cases/ProfileQueries"),
  ]);

  const createProcessingProfile = new CreateProcessingProfile(profileRepository, profileEventPublisher);
  const updateProcessingProfile = new UpdateProcessingProfile(profileRepository, profileEventPublisher);
  const deprecateProcessingProfile = new DeprecateProcessingProfile(profileRepository, profileEventPublisher);
  const profileQueries = new ProfileQueries(profileRepository);

  // ── Projection use cases ──────────────────────────────────────────
  const [
    { GenerateProjection },
    { ProjectionQueries },
    { CleanupProjections },
  ] = await Promise.all([
    import("../../../contexts/semantic-processing/projection/application/use-cases/GenerateProjection"),
    import("../../../contexts/semantic-processing/projection/application/use-cases/ProjectionQueries"),
    import("../../../contexts/semantic-processing/projection/application/use-cases/CleanupProjections"),
  ]);

  const generateProjection = new GenerateProjection(
    projectionRepository,
    profileRepository,
    materializer,
    vectorStore.write,
    projectionEventPublisher,
  );
  const projectionQueries = new ProjectionQueries(projectionRepository);
  const cleanupProjections = new CleanupProjections(projectionRepository, vectorStore.write);

  // ── Source ingestion modules ──────────────────────────────────────
  const { resolveSourceIngestionModules } = await import(
    "../../../contexts/source-ingestion/composition/factory"
  );

  const ingestion = await resolveSourceIngestionModules({
    provider: persistenceProvider,
    dbPath: policy.dbPath,
    dbName: policy.dbName,
    documentStorageProvider,
    configOverrides: policy.configOverrides,
    configStore: policy.configStore,
  });

  const [
    { RegisterSource },
    { ExtractSource },
    { IngestAndExtract },
    { SourceQueries },
    { IngestSource },
    { StoreResource },
    { RegisterExternalResource },
    { DeleteResource },
    { GetResource },
  ] = await Promise.all([
    import("../../../contexts/source-ingestion/source/application/use-cases/RegisterSource"),
    import("../../../contexts/source-ingestion/source/application/use-cases/ExtractSource"),
    import("../../../contexts/source-ingestion/source/application/use-cases/IngestAndExtract"),
    import("../../../contexts/source-ingestion/source/application/use-cases/SourceQueries"),
    import("../../../contexts/source-ingestion/source/application/use-cases/IngestSource"),
    import("../../../contexts/source-ingestion/resource/application/use-cases/StoreResource"),
    import("../../../contexts/source-ingestion/resource/application/use-cases/RegisterExternalResource"),
    import("../../../contexts/source-ingestion/resource/application/use-cases/DeleteResource"),
    import("../../../contexts/source-ingestion/resource/application/use-cases/GetResource"),
  ]);

  const storeResource = new StoreResource(
    ingestion.resourceRepository,
    ingestion.resourceStorage,
    ingestion.resourceStorageProvider,
    ingestion.resourceEventPublisher,
  );
  const registerExternalResource = new RegisterExternalResource(
    ingestion.resourceRepository,
    ingestion.resourceEventPublisher,
  );
  const deleteResource = new DeleteResource(
    ingestion.resourceRepository,
    ingestion.resourceStorage,
    ingestion.resourceEventPublisher,
  );
  const getResource = new GetResource(ingestion.resourceRepository);

  const sourceQueries = new SourceQueries(ingestion.sourceRepository, ingestion.extractionJobRepository);
  const registerSource = new RegisterSource(ingestion.sourceRepository, ingestion.sourceEventPublisher);
  const extractSource = new ExtractSource(
    ingestion.sourceRepository,
    ingestion.sourceEventPublisher,
    ingestion.extraction.executeExtraction,
  );
  const ingestAndExtract = new IngestAndExtract(
    ingestion.sourceRepository,
    ingestion.sourceEventPublisher,
    ingestion.extraction.executeExtraction,
  );
  const ingestSource = new IngestSource(ingestAndExtract, storeResource, registerExternalResource);

  // ── Context-management: infra + use cases ─────────────────────────
  const contextPolicy = { provider: persistenceProvider, dbPath: policy.dbPath, dbName: policy.dbName };

  const [
    { contextFactory },
    { lineageFactory },
  ] = await Promise.all([
    import("../../../contexts/context-management/context/composition/factory"),
    import("../../../contexts/context-management/lineage/composition/factory"),
  ]);

  const [{ infra: contextInfra }, { infra: lineageInfra }] = await Promise.all([
    contextFactory(contextPolicy),
    lineageFactory(contextPolicy),
  ]);

  const [
    { CreateContext },
    { AddSourceToContext },
    { RemoveSourceFromContext },
    { TransitionContextState },
    { UpdateContextProfile },
    { ContextQueries },
    { ReconcileProjections: ReconcileProjectionsCM },
    { LinkContexts },
    { UnlinkContexts },
    { LineageQueries },
  ] = await Promise.all([
    import("../../../contexts/context-management/context/application/use-cases/CreateContext"),
    import("../../../contexts/context-management/context/application/use-cases/AddSourceToContext"),
    import("../../../contexts/context-management/context/application/use-cases/RemoveSourceFromContext"),
    import("../../../contexts/context-management/context/application/use-cases/TransitionContextState"),
    import("../../../contexts/context-management/context/application/use-cases/UpdateContextProfile"),
    import("../../../contexts/context-management/context/application/use-cases/ContextQueries"),
    import("../../../contexts/context-management/context/application/use-cases/ReconcileProjections"),
    import("../../../contexts/context-management/lineage/application/use-cases/LinkContexts"),
    import("../../../contexts/context-management/lineage/application/use-cases/UnlinkContexts"),
    import("../../../contexts/context-management/lineage/application/use-cases/LineageQueries"),
  ]);

  const createContext = new CreateContext(contextInfra.repository, contextInfra.eventPublisher);
  const addSourceToContext = new AddSourceToContext(contextInfra.repository, contextInfra.eventPublisher);
  const removeSourceFromContext = new RemoveSourceFromContext(contextInfra.repository, contextInfra.eventPublisher);
  const transitionContextState = new TransitionContextState(contextInfra.repository, contextInfra.eventPublisher);
  const updateContextProfile = new UpdateContextProfile(contextInfra.repository, contextInfra.eventPublisher);

  const linkContexts = new LinkContexts(lineageInfra.repository);
  const unlinkContexts = new UnlinkContexts(lineageInfra.repository);
  const lineageQueries = new LineageQueries(lineageInfra.repository);

  // ── Cross-context adapters ────────────────────────────────────────
  const [
    { SourceIngestionAdapter },
    { ProjectionOperationsAdapter },
    { SourceTextAdapter },
    { SourceMetadataAdapter },
    { ProjectionStatsAdapter },
    { ActiveProfilesAdapter },
    { ProcessSourceAllProfiles },
  ] = await Promise.all([
    import("../../../contexts/semantic-processing/projection/infrastructure/adapters/SourceIngestionAdapter"),
    import("../../../contexts/context-management/context/infrastructure/adapters/ProjectionOperationsAdapter"),
    import("../../../contexts/context-management/context/infrastructure/adapters/SourceTextAdapter"),
    import("../../../contexts/context-management/context/infrastructure/adapters/SourceMetadataAdapter"),
    import("../../../contexts/context-management/context/infrastructure/adapters/ProjectionStatsAdapter"),
    import("../../../contexts/context-management/context/infrastructure/adapters/ActiveProfilesAdapter"),
    import("../../../contexts/semantic-processing/projection/application/use-cases/ProcessSourceAllProfiles"),
  ]);

  const sourceIngestionAdapter = new SourceIngestionAdapter(sourceQueries);
  const projectionOperationsAdapter = new ProjectionOperationsAdapter(
    projectionQueries,
    cleanupProjections,
    generateProjection,
  );
  const sourceTextAdapter = new SourceTextAdapter(sourceQueries);
  const sourceMetadataAdapter = new SourceMetadataAdapter(sourceQueries);
  const projectionStatsAdapter = new ProjectionStatsAdapter(projectionQueries);
  const activeProfilesAdapter = new ActiveProfilesAdapter(profileQueries);

  const contextQueries = new ContextQueries(
    contextInfra.repository,
    sourceMetadataAdapter,
    projectionStatsAdapter,
  );

  const reconcileProjections = new ReconcileProjectionsCM(
    contextInfra.repository,
    projectionOperationsAdapter,
    sourceTextAdapter,
    activeProfilesAdapter,
  );

  const processSourceAllProfiles = new ProcessSourceAllProfiles(
    profileQueries,
    projectionQueries,
    generateProjection,
    sourceIngestionAdapter,
  );

  // ── Search + Process ──────────────────────────────────────────────
  const [
    { ContextSourceAdapter },
    { SearchKnowledge },
    { ProcessKnowledge },
  ] = await Promise.all([
    import("../../../contexts/knowledge-retrieval/semantic-query/infrastructure/adapters/ContextSourceAdapter"),
    import("../../../contexts/knowledge-retrieval/semantic-query/application/use-cases/SearchKnowledge"),
    import("../orchestrators/ProcessKnowledge"),
  ]);

  const { semanticQueryFactory } = await import(
    "../../../contexts/knowledge-retrieval/semantic-query/composition/factory"
  );
  const { infra: retrievalInfra } = await semanticQueryFactory({
    provider: persistenceProvider,
    vectorStoreProvider: platform.resolved.vectorStoreProvider,
    vectorStoreConfig: platform.vectorStoreConfig,
    embeddingDimensions: platform.resolved.embeddingDimensions,
    embeddingProvider: platform.resolved.embeddingProvider,
    embeddingModel: platform.resolved.embeddingModel,
    retrieval: policy.infrastructure?.retrieval,
    configOverrides: policy.configOverrides,
    configStore: policy.configStore,
  });

  const contextSourceAdapter = new ContextSourceAdapter(contextInfra.repository);
  const searchKnowledge = new SearchKnowledge(retrievalInfra, contextSourceAdapter);

  const processKnowledge = new ProcessKnowledge({
    ingestAndExtract,
    sourceQueries,
    projectionOperations: projectionOperationsAdapter,
    contextQueries,
    addSourceToContext,
  });

  return {
    sourceQueries,
    createProcessingProfile,
    updateProcessingProfile,
    deprecateProcessingProfile,
    profileQueries,
    processKnowledge,
    contextQueries,
    reconcileProjections,
    processSourceAllProfiles,
    searchKnowledge,
    createContext,
    addSourceToContext,
    removeSourceFromContext,
    transitionContextState,
    updateContextProfile,
    linkContexts,
    unlinkContexts,
    lineageQueries,
  };
}

// ── Public factory ──────────────────────────────────────────────────

export async function createKnowledgeApplication(
  policy: OrchestratorPolicy,
): Promise<KnowledgeApplication> {
  const deps = await resolveDependencies(policy);
  return {
    ...deps,
    createContextAndActivate: new CreateContextAndActivate(deps.createContext, deps.transitionContextState),
    updateContextProfileAndReconcile: new UpdateContextProfileAndReconcile(deps.updateContextProfile, deps.reconcileProjections),
  };
}

/** @deprecated Use createKnowledgeApplication() */
export const createKnowledgePlatform = createKnowledgeApplication;
