import type { OrchestratorPolicy } from "../../composition/OrchestratorPolicy";
import { Result } from "../../../shared/domain/Result";
import { KnowledgeError } from "../domain/KnowledgeError";
import { OperationStep } from "../domain/OperationStep";
import { ProcessKnowledge } from "../ProcessKnowledge";
import { CreateContextAndActivate } from "../CreateContextAndActivate";
import { UpdateContextProfileAndReconcile } from "../UpdateContextProfileAndReconcile";
import type {
  CreateProcessingProfileSuccess,
  ListProfilesResult,
  UpdateProfileResult,
  DeprecateProfileResult,
  ListSourcesResult,
  GetSourceResult,
  RemoveSourceResult,
  LinkContextsResult,
  UnlinkContextsResult,
  GetContextLineageResult,
  TransitionContextStateInput,
  TransitionContextStateResult,
  ProcessSourceAllProfilesResult,
} from "../dtos";
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

// ── Resolved dependencies (internal, unchanged) ──────────────────────────────

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

// ── Public application type ──────────────────────────────────────────────────

/**
 * KnowledgeApplication — exposes all use cases directly + 2 orchestrators.
 *
 * Consumers call use cases directly (e.g. `app.processKnowledge.execute(input)`)
 * instead of going through a 22-method facade. DTO mapping utilities are
 * exported as standalone functions for consumers that need them.
 */
export interface KnowledgeApplication extends ResolvedDependencies {
  createContextAndActivate: CreateContextAndActivate;
  updateContextProfileAndReconcile: UpdateContextProfileAndReconcile;
}

// ── DTO mapping utilities (for web consumers) ────────────────────────────────

export function mapSourcesToDTO(sources: any[]): ListSourcesResult {
  return {
    sources: sources.map((s: any) => ({
      id: s.id.value,
      name: s.name,
      type: s.type,
      uri: s.uri,
      hasBeenExtracted: s.hasBeenExtracted,
      currentVersion: s.currentVersion?.version ?? null,
      registeredAt: s.registeredAt.toISOString(),
    })),
    total: sources.length,
  };
}

export async function mapSourceToDetailDTO(source: any, sourceQueries: any): Promise<GetSourceResult> {
  let extractedTextPreview: string | null = null;
  const textResult = await sourceQueries.getExtractedText(source.id.value);
  if (textResult.isOk()) {
    const text = textResult.value.text;
    extractedTextPreview = text.length > 500 ? text.slice(0, 500) + "..." : text;
  }
  return {
    source: {
      id: source.id.value,
      name: source.name,
      type: source.type,
      uri: source.uri,
      hasBeenExtracted: source.hasBeenExtracted,
      currentVersion: source.currentVersion?.version ?? null,
      registeredAt: source.registeredAt.toISOString(),
      versions: source.versions.map((v: any) => ({
        version: v.version,
        contentHash: v.contentHash,
        extractedAt: v.extractedAt.toISOString(),
      })),
      extractedTextPreview,
    },
  };
}

export function mapProfilesToDTO(profiles: any[]): ListProfilesResult {
  return {
    profiles: profiles.map((p: any) => ({
      id: p.id.value,
      name: p.name,
      version: p.version,
      preparation: p.preparation.toDTO(),
      fragmentation: p.fragmentation.toDTO(),
      projection: p.projection.toDTO(),
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

export function mapTransitionResult(ctx: any): TransitionContextStateResult {
  return { contextId: ctx.id.value, state: ctx.state };
}

export function mapRemoveSourceResult(ctx: any): RemoveSourceResult {
  return { contextId: ctx.id.value, version: ctx.currentVersion?.version ?? 0 };
}

export function mapLinkResult(v: any): LinkContextsResult {
  return { sourceContextId: v.fromContextId, targetContextId: v.toContextId };
}

export function mapUnlinkResult(v: any): UnlinkContextsResult {
  return { sourceContextId: v.fromContextId, targetContextId: v.toContextId };
}

export function mapLineageResult(v: any): GetContextLineageResult {
  return {
    contextId: v.contextId,
    traces: v.traces.map((t: any) => ({ ...t, createdAt: t.createdAt.toISOString() })),
  };
}

export function mapCreateProfileResult(v: any): CreateProcessingProfileSuccess {
  return { profileId: v.profileId, version: v.version };
}

export function mapUpdateProfileResult(v: any): UpdateProfileResult {
  return { profileId: v.profileId, version: v.version };
}

export function mapDeprecateProfileResult(v: any): DeprecateProfileResult {
  return { profileId: v.profileId };
}

/**
 * Maps a TransitionContextStateInput (targetState: "ACTIVE"|"DEPRECATED"|"ARCHIVED")
 * to the use case input (action: "activate"|"deprecate"|"archive").
 */
export function mapTransitionInput(input: TransitionContextStateInput) {
  const actionMap = { ACTIVE: "activate", DEPRECATED: "deprecate", ARCHIVED: "archive" } as const;
  return {
    contextId: input.contextId,
    action: actionMap[input.targetState],
    ...(input.reason && { reason: input.reason }),
  };
}

/**
 * Convenience: execute transitionContextState use case with DTO mapping.
 * Wraps the use case call + error handling + DTO mapping in a single function.
 */
export async function executeTransitionContextState(
  transitionContextState: TransitionContextState,
  input: TransitionContextStateInput,
): Promise<Result<KnowledgeError, TransitionContextStateResult>> {
  try {
    const result = await transitionContextState.execute(mapTransitionInput(input));
    if (result.isFail()) return Result.fail(KnowledgeError.fromStep(OperationStep.TransitionState, result.error, []));
    return Result.ok(mapTransitionResult(result.value));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.TransitionState, error, []));
  }
}

/**
 * Convenience: execute removeSourceFromContext use case with DTO mapping.
 */
export async function executeRemoveSource(
  removeSourceFromContext: RemoveSourceFromContext,
  input: { contextId: string; sourceId: string },
): Promise<Result<KnowledgeError, RemoveSourceResult>> {
  try {
    const result = await removeSourceFromContext.execute(input);
    if (result.isFail()) return Result.fail(KnowledgeError.fromStep(OperationStep.RemoveSource, result.error, []));
    return Result.ok(mapRemoveSourceResult(result.value));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.RemoveSource, error, []));
  }
}

/**
 * Convenience: execute linkContexts use case with DTO mapping.
 */
export async function executeLinkContexts(
  linkContexts: LinkContexts,
  input: { sourceContextId: string; targetContextId: string; relationshipType: string },
): Promise<Result<KnowledgeError, LinkContextsResult>> {
  try {
    const result = await linkContexts.execute({
      fromContextId: input.sourceContextId,
      toContextId: input.targetContextId,
      relationship: input.relationshipType,
    });
    if (result.isFail()) return Result.fail(KnowledgeError.fromStep(OperationStep.Link, result.error, []));
    return Result.ok(mapLinkResult(result.value));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Link, error, []));
  }
}

/**
 * Convenience: execute unlinkContexts use case with DTO mapping.
 */
export async function executeUnlinkContexts(
  unlinkContexts: UnlinkContexts,
  input: { sourceContextId: string; targetContextId: string },
): Promise<Result<KnowledgeError, UnlinkContextsResult>> {
  try {
    const result = await unlinkContexts.execute({
      fromContextId: input.sourceContextId,
      toContextId: input.targetContextId,
    });
    if (result.isFail()) return Result.fail(KnowledgeError.fromStep(OperationStep.Unlink, result.error, []));
    return Result.ok(mapUnlinkResult(result.value));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Unlink, error, []));
  }
}

/**
 * Convenience: execute getContextLineage with DTO mapping.
 */
export async function executeGetContextLineage(
  lineageQueries: LineageQueries,
  contextId: string,
): Promise<Result<KnowledgeError, GetContextLineageResult>> {
  try {
    const result = await lineageQueries.getLineage(contextId);
    if (result.isFail()) return Result.fail(KnowledgeError.fromStep(OperationStep.Link, result.error, []));
    return Result.ok(mapLineageResult(result.value));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Link, error, []));
  }
}

/**
 * Convenience: list sources with DTO mapping wrapped in Result.
 */
export async function executeListSources(
  sourceQueries: SourceQueries,
): Promise<Result<KnowledgeError, ListSourcesResult>> {
  try {
    const sources = await sourceQueries.listAll();
    return Result.ok(mapSourcesToDTO(sources));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Ingestion, error, []));
  }
}

/**
 * Convenience: get source detail with DTO mapping wrapped in Result.
 */
export async function executeGetSource(
  sourceQueries: SourceQueries,
  sourceId: string,
): Promise<Result<KnowledgeError, GetSourceResult>> {
  try {
    const source = await sourceQueries.getById(sourceId);
    if (!source) {
      throw { message: `Source ${sourceId} not found`, code: "SOURCE_NOT_FOUND" };
    }
    return Result.ok(await mapSourceToDetailDTO(source, sourceQueries));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Ingestion, error, []));
  }
}

/**
 * Convenience: create profile with DTO mapping wrapped in Result.
 */
export async function executeCreateProfile(
  createProcessingProfile: CreateProcessingProfile,
  input: { id: string; name: string; preparation: any; fragmentation: any; projection: any },
): Promise<Result<KnowledgeError, CreateProcessingProfileSuccess>> {
  try {
    const result = await createProcessingProfile.execute(input);
    if (result.isFail()) return Result.fail(KnowledgeError.fromStep(OperationStep.Processing, result.error, []));
    return Result.ok(mapCreateProfileResult(result.value));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Processing, error, []));
  }
}

/**
 * Convenience: list profiles with DTO mapping wrapped in Result.
 */
export async function executeListProfiles(
  profileQueries: ProfileQueries,
): Promise<Result<KnowledgeError, ListProfilesResult>> {
  try {
    const profiles = await profileQueries.listAll();
    return Result.ok(mapProfilesToDTO(profiles));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Processing, error, []));
  }
}

/**
 * Convenience: update profile with DTO mapping wrapped in Result.
 */
export async function executeUpdateProfile(
  updateProcessingProfile: UpdateProcessingProfile,
  input: { id: string; name?: string; preparation?: any; fragmentation?: any; projection?: any },
): Promise<Result<KnowledgeError, UpdateProfileResult>> {
  try {
    const result = await updateProcessingProfile.execute(input);
    if (result.isFail()) return Result.fail(KnowledgeError.fromStep(OperationStep.Processing, result.error, []));
    return Result.ok(mapUpdateProfileResult(result.value));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Processing, error, []));
  }
}

/**
 * Convenience: deprecate profile with DTO mapping wrapped in Result.
 */
export async function executeDeprecateProfile(
  deprecateProcessingProfile: DeprecateProcessingProfile,
  input: { id: string; reason: string },
): Promise<Result<KnowledgeError, DeprecateProfileResult>> {
  try {
    const result = await deprecateProcessingProfile.execute(input);
    if (result.isFail()) return Result.fail(KnowledgeError.fromStep(OperationStep.Processing, result.error, []));
    return Result.ok(mapDeprecateProfileResult(result.value));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Processing, error, []));
  }
}

// ── Dependency resolver ───────────────────────────────────────────────────────

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

  // ── Projection use cases ───────────────────────────────────────────
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

  // ── Source ingestion modules ───────────────────────────────────────
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

  // ── Cross-context adapters ─────────────────────────────────────────
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

  // ── Search + Process ───────────────────────────────────────────────
  const [
    { ContextSourceAdapter },
    { SearchKnowledge },
    { ProcessKnowledge },
  ] = await Promise.all([
    import("../../../contexts/knowledge-retrieval/semantic-query/infrastructure/adapters/ContextSourceAdapter"),
    import("../../../contexts/knowledge-retrieval/semantic-query/application/use-cases/SearchKnowledge"),
    import("../ProcessKnowledge"),
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

// ── Public factory ────────────────────────────────────────────────────────────

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
