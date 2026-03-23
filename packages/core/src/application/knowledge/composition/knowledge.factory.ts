import type { KnowledgeCoordinator, ResolvedDependencies } from "../KnowledgeCoordinator";
import type { OrchestratorPolicy } from "../../composition/OrchestratorPolicy";

export async function resolveDependencies(
  policy: OrchestratorPolicy,
): Promise<ResolvedDependencies> {
  const { resolvePlatformDependencies } = await import(
    "../../composition/resolvePlatformDependencies"
  );

  const platform = await resolvePlatformDependencies(policy);
  const { persistenceProvider, embeddingProvider, embeddingDimensions, embeddingModel, vectorStoreProvider } =
    platform.resolved;

  // ── Semantic-processing infra components ──────────────────────────
  const {
    projectionInfra,
    profileRepository,
    profileEventPublisher,
  } = platform;

  const {
    repository: projectionRepository,
    vectorWriteStore,
    materializer,
    eventPublisher: projectionEventPublisher,
  } = projectionInfra;

  // ── Processing-profile use cases ─────────────────────────────────
  const { CreateProcessingProfile } = await import(
    "../../../contexts/semantic-processing/processing-profile/application/use-cases/CreateProcessingProfile"
  );
  const { UpdateProcessingProfile } = await import(
    "../../../contexts/semantic-processing/processing-profile/application/use-cases/UpdateProcessingProfile"
  );
  const { DeprecateProcessingProfile } = await import(
    "../../../contexts/semantic-processing/processing-profile/application/use-cases/DeprecateProcessingProfile"
  );
  const { ListProcessingProfiles } = await import(
    "../../../contexts/semantic-processing/processing-profile/application/use-cases/ListProcessingProfiles"
  );
  const { GetProcessingProfile } = await import(
    "../../../contexts/semantic-processing/processing-profile/application/use-cases/GetProcessingProfile"
  );

  const createProcessingProfile = new CreateProcessingProfile(profileRepository, profileEventPublisher);
  const updateProcessingProfile = new UpdateProcessingProfile(profileRepository, profileEventPublisher);
  const deprecateProcessingProfile = new DeprecateProcessingProfile(profileRepository, profileEventPublisher);
  const listProcessingProfiles = new ListProcessingProfiles(profileRepository);
  const getProcessingProfile = new GetProcessingProfile(profileRepository);

  // ── Projection use cases (in order of deps) ───────────────────────
  const { GenerateProjection } = await import(
    "../../../contexts/semantic-processing/projection/application/use-cases/GenerateProjection"
  );
  const { ProcessContent } = await import(
    "../../../contexts/semantic-processing/projection/application/use-cases/ProcessContent"
  );
  const { FindExistingProjection } = await import(
    "../../../contexts/semantic-processing/projection/application/use-cases/FindExistingProjection"
  );
  const { GetProjectionsForSources } = await import(
    "../../../contexts/semantic-processing/projection/application/use-cases/GetProjectionsForSources"
  );
  const { GetAllProjectionsForSources } = await import(
    "../../../contexts/semantic-processing/projection/application/use-cases/GetAllProjectionsForSources"
  );
  const { CleanupSourceProjections } = await import(
    "../../../contexts/semantic-processing/projection/application/use-cases/CleanupSourceProjections"
  );
  const { CleanupSourceProjectionForProfile } = await import(
    "../../../contexts/semantic-processing/projection/application/use-cases/CleanupSourceProjectionForProfile"
  );
  const { BatchProcessContent } = await import(
    "../../../contexts/semantic-processing/projection/application/use-cases/BatchProcessContent"
  );

  const generateProjection = new GenerateProjection(
    projectionRepository,
    profileRepository,
    materializer,
    vectorWriteStore,
    projectionEventPublisher,
  );
  const processContent = new ProcessContent(generateProjection);
  const findExistingProjection = new FindExistingProjection(projectionRepository);
  const getProjectionsForSources = new GetProjectionsForSources(findExistingProjection);
  const getAllProjectionsForSources = new GetAllProjectionsForSources(projectionRepository);
  const cleanupSourceProjections = new CleanupSourceProjections(projectionRepository, vectorWriteStore);
  const cleanupSourceProjectionForProfile = new CleanupSourceProjectionForProfile(projectionRepository, vectorWriteStore);
  const batchProcessContent = new BatchProcessContent(processContent);

  // ── Knowledge retrieval context ────────────────────────────────────
  const { resolveKnowledgeRetrievalModules } = await import(
    "../../../contexts/knowledge-retrieval/composition/factory"
  );

  const modules = await resolveKnowledgeRetrievalModules({
    provider: persistenceProvider,
    vectorStoreConfig: platform.vectorStoreConfig,
    embeddingDimensions,
    embeddingProvider,
    embeddingModel,
    vectorStoreProvider,
    retrieval: policy.infrastructure?.retrieval,
    configOverrides: policy.configOverrides,
    configStore: policy.configStore,
  });

  const retrievalInfra = modules.semanticQueryInfra;

  // ── Source Ingestion: resolve infra modules ────────────────────────
  const { resolveSourceIngestionModules } = await import(
    "../../../contexts/source-ingestion/composition/factory"
  );

  const ingestionModules = await resolveSourceIngestionModules({
    provider: persistenceProvider,
    dbPath: policy.dbPath,
    dbName: policy.dbName,
    documentStorageProvider: platform.resolved.documentStorageProvider,
    configOverrides: policy.configOverrides,
    configStore: policy.configStore,
  });

  // ── Source Ingestion: individual use cases ─────────────────────────
  const { ListSources } = await import(
    "../../../contexts/source-ingestion/source/application/use-cases/ListSources"
  );
  const { GetSource } = await import(
    "../../../contexts/source-ingestion/source/application/use-cases/GetSource"
  );
  const { GetExtractedText } = await import(
    "../../../contexts/source-ingestion/source/application/use-cases/GetExtractedText"
  );
  const { RegisterSource } = await import(
    "../../../contexts/source-ingestion/source/application/use-cases/RegisterSource"
  );
  const { GetSourceCount } = await import(
    "../../../contexts/source-ingestion/source/application/use-cases/GetSourceCount"
  );
  const { ExtractSource } = await import(
    "../../../contexts/source-ingestion/source/application/use-cases/ExtractSource"
  );
  const { IngestAndExtract } = await import(
    "../../../contexts/source-ingestion/source/application/use-cases/IngestAndExtract"
  );
  const { IngestFile } = await import(
    "../../../contexts/source-ingestion/source/application/use-cases/IngestFile"
  );
  const { IngestExternalResource } = await import(
    "../../../contexts/source-ingestion/source/application/use-cases/IngestExternalResource"
  );
  const { BatchRegister } = await import(
    "../../../contexts/source-ingestion/source/application/use-cases/BatchRegister"
  );
  const { BatchIngestAndExtract } = await import(
    "../../../contexts/source-ingestion/source/application/use-cases/BatchIngestAndExtract"
  );
  const { StoreResource } = await import(
    "../../../contexts/source-ingestion/resource/application/use-cases/StoreResource"
  );
  const { RegisterExternalResource } = await import(
    "../../../contexts/source-ingestion/resource/application/use-cases/RegisterExternalResource"
  );
  const { DeleteResource } = await import(
    "../../../contexts/source-ingestion/resource/application/use-cases/DeleteResource"
  );
  const { GetResource } = await import(
    "../../../contexts/source-ingestion/resource/application/use-cases/GetResource"
  );

  // Resolve execution dependencies from ingestion modules
  const {
    extraction: extractionUseCases,
    extractionJobRepository,
    sourceRepository,
    sourceEventPublisher,
    resourceRepository,
    resourceStorage,
    resourceStorageProvider,
    resourceEventPublisher,
  } = ingestionModules;

  // Resource use cases
  const storeResource = new StoreResource(
    resourceRepository,
    resourceStorage,
    resourceStorageProvider,
    resourceEventPublisher,
  );
  const registerExternalResource = new RegisterExternalResource(
    resourceRepository,
    resourceEventPublisher,
  );
  const deleteResource = new DeleteResource(
    resourceRepository,
    resourceStorage,
    resourceEventPublisher,
  );
  const getResource = new GetResource(resourceRepository);

  // Source read use cases
  const listSources = new ListSources(sourceRepository);
  const getSource = new GetSource(sourceRepository);
  const getSourceCount = new GetSourceCount(sourceRepository);
  const registerSource = new RegisterSource(sourceRepository, sourceEventPublisher);

  // Extraction-dependent source use cases
  const getExtractedText = new GetExtractedText(
    sourceRepository,
    extractionJobRepository,
  );
  const extractSource = new ExtractSource(
    sourceRepository,
    sourceEventPublisher,
    extractionUseCases.executeExtraction,
  );

  // Composite source use cases
  const ingestAndExtract = new IngestAndExtract(
    sourceRepository,
    sourceEventPublisher,
    extractionUseCases.executeExtraction,
  );
  const ingestFile = new IngestFile(
    storeResource,
    sourceRepository,
    sourceEventPublisher,
    extractionUseCases.executeExtraction,
  );
  const ingestExternalResource = new IngestExternalResource(
    registerExternalResource,
    sourceRepository,
    sourceEventPublisher,
    extractionUseCases.executeExtraction,
  );
  const batchRegister = new BatchRegister(registerSource);
  const batchIngestAndExtract = new BatchIngestAndExtract(ingestAndExtract);

  // ── Context-management infra (repos + event publishers) ────────────
  const { contextFactory } = await import(
    "../../../contexts/context-management/context/composition/factory"
  );
  const { lineageFactory } = await import(
    "../../../contexts/context-management/lineage/composition/factory"
  );

  const contextPolicy = {
    provider: platform.resolved.persistenceProvider,
    dbPath: policy.dbPath,
    dbName: policy.dbName,
  };

  const [{ infra: contextInfra }, { infra: lineageInfra }] = await Promise.all([
    contextFactory(contextPolicy),
    lineageFactory(contextPolicy),
  ]);

  const contextRepository = contextInfra.repository;
  const contextEventPublisher = contextInfra.eventPublisher;
  const lineageRepository = lineageInfra.repository;

  // ── Context-management use cases (leaf nodes — no ContextManagementService) ──

  const { CreateContext } = await import(
    "../../../contexts/context-management/context/application/use-cases/CreateContext"
  );
  const { GetContext } = await import(
    "../../../contexts/context-management/context/application/use-cases/GetContext"
  );
  const { ListContexts } = await import(
    "../../../contexts/context-management/context/application/use-cases/ListContexts"
  );
  const { GetContextsForSource } = await import(
    "../../../contexts/context-management/context/application/use-cases/GetContextsForSource"
  );
  const { AddSourceToContext } = await import(
    "../../../contexts/context-management/context/application/use-cases/AddSourceToContext"
  );
  const { RemoveSourceFromContext } = await import(
    "../../../contexts/context-management/context/application/use-cases/RemoveSourceFromContext"
  );
  const { TransitionContextState } = await import(
    "../../../contexts/context-management/context/application/use-cases/TransitionContextState"
  );
  const { UpdateContextProfile } = await import(
    "../../../contexts/context-management/context/application/use-cases/UpdateContextProfile"
  );

  const createContext = new CreateContext(contextRepository, contextEventPublisher);
  const getContext = new GetContext(contextRepository);
  const listContexts = new ListContexts(contextRepository);
  const getContextsForSource = new GetContextsForSource(contextRepository);
  const addSourceToContext = new AddSourceToContext(contextRepository, contextEventPublisher);
  const removeSourceFromContext = new RemoveSourceFromContext(contextRepository, contextEventPublisher);
  const transitionContextState = new TransitionContextState(contextRepository, contextEventPublisher);
  const updateContextProfile = new UpdateContextProfile(contextRepository, contextEventPublisher);

  // ── SourceIngestionAdapter (for ProcessSourceAllProfiles) ──────────
  const { SourceIngestionAdapter } = await import(
    "../../../contexts/semantic-processing/projection/infrastructure/adapters/SourceIngestionAdapter"
  );

  const sourceIngestionAdapter = new SourceIngestionAdapter(getSource, getExtractedText);

  // ── ProcessSourceAllProfiles ───────────────────────────────────────
  const { ProcessSourceAllProfiles } = await import(
    "../../../contexts/semantic-processing/projection/application/use-cases/ProcessSourceAllProfiles"
  );

  const processSourceAllProfiles = new ProcessSourceAllProfiles(
    listProcessingProfiles,
    findExistingProjection,
    processContent,
    sourceIngestionAdapter,
  );

  // ── ProjectionOperationsAdapter ────────────────────────────────────
  const { ProjectionOperationsAdapter } = await import(
    "../../../contexts/context-management/context/infrastructure/adapters/ProjectionOperationsAdapter"
  );

  const projectionOperationsAdapter = new ProjectionOperationsAdapter(
    findExistingProjection,
    cleanupSourceProjectionForProfile,
    processContent,
  );

  // ── Context-management adapters ────────────────────────────────────
  const { SourceTextAdapter } = await import(
    "../../../contexts/context-management/context/infrastructure/adapters/SourceTextAdapter"
  );
  const { SourceMetadataAdapter } = await import(
    "../../../contexts/context-management/context/infrastructure/adapters/SourceMetadataAdapter"
  );
  const { ProjectionStatsAdapter } = await import(
    "../../../contexts/context-management/context/infrastructure/adapters/ProjectionStatsAdapter"
  );
  const { ActiveProfilesAdapter } = await import(
    "../../../contexts/context-management/context/infrastructure/adapters/ActiveProfilesAdapter"
  );

  const sourceTextAdapter = new SourceTextAdapter(getExtractedText);
  const sourceMetadataAdapter = new SourceMetadataAdapter(getSource);
  const projectionStatsAdapter = new ProjectionStatsAdapter(getAllProjectionsForSources);
  const activeProfilesAdapter = new ActiveProfilesAdapter(listProcessingProfiles);

  // ── GetContextDetails + ListContextsSummary ────────────────────────
  const { GetContextDetails } = await import(
    "../../../contexts/context-management/context/application/use-cases/GetContextDetails"
  );
  const { ListContextsSummary } = await import(
    "../../../contexts/context-management/context/application/use-cases/ListContextsSummary"
  );

  const getContextDetails = new GetContextDetails(
    contextRepository,
    sourceMetadataAdapter,
    projectionStatsAdapter,
  );
  const listContextsSummary = new ListContextsSummary(
    contextRepository,
    projectionStatsAdapter,
  );

  // ── ReconcileProjections + ReconcileAllProfiles ────────────────────
  const { ReconcileProjections: ReconcileProjectionsCM } = await import(
    "../../../contexts/context-management/context/application/use-cases/ReconcileProjections"
  );
  const { ReconcileAllProfiles } = await import(
    "../../../contexts/context-management/context/application/use-cases/ReconcileAllProfiles"
  );

  const reconcileProjectionsCM = new ReconcileProjectionsCM(
    contextRepository,
    projectionOperationsAdapter,
    sourceTextAdapter,
  );
  const reconcileAllProfiles = new ReconcileAllProfiles(
    reconcileProjectionsCM,
    activeProfilesAdapter,
  );

  // ── Lineage use cases ──────────────────────────────────────────────
  const { LinkContexts } = await import(
    "../../../contexts/context-management/lineage/application/use-cases/LinkContexts"
  );
  const { UnlinkContexts } = await import(
    "../../../contexts/context-management/lineage/application/use-cases/UnlinkContexts"
  );
  const { GetLineage } = await import(
    "../../../contexts/context-management/lineage/application/use-cases/GetLineage"
  );

  const linkContexts = new LinkContexts(lineageRepository);
  const unlinkContexts = new UnlinkContexts(lineageRepository);
  const getLineage = new GetLineage(lineageRepository);

  // ── Task 3.3: Knowledge-retrieval adapter ─────────────────────────
  const { ContextSourceAdapter } = await import(
    "../../../contexts/knowledge-retrieval/semantic-query/infrastructure/adapters/ContextSourceAdapter"
  );

  const contextSourceAdapter = new ContextSourceAdapter(contextRepository);

  // ── SearchKnowledge ────────────────────────────────────────────────
  const { SearchKnowledge } = await import(
    "../../../contexts/knowledge-retrieval/semantic-query/application/use-cases/SearchKnowledge"
  );

  const searchKnowledge = new SearchKnowledge(
    retrievalInfra,
    contextSourceAdapter,
  );

  // ── ProcessKnowledge ──────────────────────────────────────────────
  const { ProcessKnowledge } = await import("../ProcessKnowledge");

  const processKnowledge = new ProcessKnowledge({
    ingestAndExtract,
    getSource,
    getExtractedText,
    projectionOperations: projectionOperationsAdapter,
    getContext,
    addSourceToContext,
  });

  return {
    listSources,
    getSource,
    getExtractedText,
    createProcessingProfile,
    updateProcessingProfile,
    deprecateProcessingProfile,
    listProcessingProfiles,
    getProcessingProfile,
    processKnowledge,
    getContextDetails,
    listContextsSummary,
    reconcileProjections: reconcileProjectionsCM,
    reconcileAllProfiles,
    processSourceAllProfiles,
    searchKnowledge,
    createContext,
    getContext,
    listContexts,
    getContextsForSource,
    addSourceToContext,
    removeSourceFromContext,
    transitionContextState,
    updateContextProfile,
    linkContexts,
    unlinkContexts,
    getLineage,
  };
}

export async function createKnowledgePlatform(
  policy: OrchestratorPolicy,
): Promise<KnowledgeCoordinator> {
  const { KnowledgeCoordinator } = await import(
    "../KnowledgeCoordinator"
  );

  const deps = await resolveDependencies(policy);
  return new KnowledgeCoordinator(deps);
}
