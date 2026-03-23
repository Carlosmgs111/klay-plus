import type { OrchestratorPolicy } from "../../composition/OrchestratorPolicy";
import { Result } from "../../../shared/domain/Result";
import { KnowledgeError } from "../domain/KnowledgeError";
import { OperationStep } from "../domain/OperationStep";
import { ProcessKnowledge } from "../ProcessKnowledge";
import type {
  ProcessKnowledgeInput,
  ProcessKnowledgeSuccess,
  SearchKnowledgeInput,
  SearchKnowledgeSuccess,
  CreateProcessingProfileInput,
  CreateProcessingProfileSuccess,
  ListProfilesResult,
  UpdateProfileInput,
  UpdateProfileResult,
  DeprecateProfileInput,
  DeprecateProfileResult,
  GetContextDetailsInput,
  GetContextDetailsResult,
  ListContextsSummaryResult,
  ListContextsResult,
  GetSourceInput,
  GetSourceResult,
  GetSourceContextsInput,
  GetSourceContextsResult,
  RemoveSourceInput,
  RemoveSourceResult,
  ReconcileProjectionsInput,
  ReconcileProjectionsResult,
  ReconcileAllProfilesInput,
  ReconcileAllProfilesResult,
  ProcessSourceAllProfilesInput,
  ProcessSourceAllProfilesResult,
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
  ListSourcesResult,
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

// ── Public platform type ──────────────────────────────────────────────────────

/**
 * KnowledgePlatform — the single public entry point for all knowledge operations.
 *
 * Plain-object type returned by `createKnowledgePlatform()`. Replaces the
 * former `KnowledgeCoordinator` class (same method signatures, duck-typed).
 */
export type KnowledgePlatform = {
  // ── Cross-cutting ────────────────────────────────────────────────
  process(input: ProcessKnowledgeInput): Promise<Result<KnowledgeError, ProcessKnowledgeSuccess>>;
  search(input: SearchKnowledgeInput): Promise<Result<KnowledgeError, SearchKnowledgeSuccess>>;
  // ── Contexts ─────────────────────────────────────────────────────
  createContext(input: CreateContextInput): Promise<Result<KnowledgeError, CreateContextResult>>;
  getContext(input: GetContextDetailsInput): Promise<Result<KnowledgeError, GetContextDetailsResult>>;
  listContexts(): Promise<Result<KnowledgeError, ListContextsSummaryResult>>;
  listContextRefs(): Promise<Result<KnowledgeError, ListContextsResult>>;
  transitionContextState(input: TransitionContextStateInput): Promise<Result<KnowledgeError, TransitionContextStateResult>>;
  updateContextProfile(input: UpdateContextProfileInput): Promise<Result<KnowledgeError, UpdateContextProfileResult>>;
  reconcileProjections(input: ReconcileProjectionsInput): Promise<Result<KnowledgeError, ReconcileProjectionsResult>>;
  reconcileAllProfiles(input: ReconcileAllProfilesInput): Promise<Result<KnowledgeError, ReconcileAllProfilesResult>>;
  removeSourceFromContext(input: RemoveSourceInput): Promise<Result<KnowledgeError, RemoveSourceResult>>;
  linkContexts(input: LinkContextsInput): Promise<Result<KnowledgeError, LinkContextsResult>>;
  unlinkContexts(input: UnlinkContextsInput): Promise<Result<KnowledgeError, UnlinkContextsResult>>;
  getContextLineage(input: GetContextLineageInput): Promise<Result<KnowledgeError, GetContextLineageResult>>;
  // ── Sources ──────────────────────────────────────────────────────
  listSources(): Promise<Result<KnowledgeError, ListSourcesResult>>;
  getSource(input: GetSourceInput): Promise<Result<KnowledgeError, GetSourceResult>>;
  getSourceContexts(input: GetSourceContextsInput): Promise<Result<KnowledgeError, GetSourceContextsResult>>;
  processSourceAllProfiles(input: ProcessSourceAllProfilesInput): Promise<Result<KnowledgeError, ProcessSourceAllProfilesResult>>;
  // ── Profiles ─────────────────────────────────────────────────────
  createProfile(input: CreateProcessingProfileInput): Promise<Result<KnowledgeError, CreateProcessingProfileSuccess>>;
  listProfiles(): Promise<Result<KnowledgeError, ListProfilesResult>>;
  updateProfile(input: UpdateProfileInput): Promise<Result<KnowledgeError, UpdateProfileResult>>;
  deprecateProfile(input: DeprecateProfileInput): Promise<Result<KnowledgeError, DeprecateProfileResult>>;
};

// ── Resolved dependencies (kept for downstream use) ──────────────────────────

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

// ── Private helpers (module-level, mirror of old class helpers) ───────────────

async function _query<T>(
  step: OperationStep,
  fn: () => Promise<T>,
): Promise<Result<KnowledgeError, T>> {
  try {
    return Result.ok(await fn());
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(step, error, []));
  }
}

async function _wrap<T, R>(
  step: OperationStep,
  fn: () => Promise<Result<any, T>>,
  map: (v: T) => R,
): Promise<Result<KnowledgeError, R>> {
  try {
    const result = await fn();
    if (result.isFail()) return Result.fail(KnowledgeError.fromStep(step, result.error, []));
    return Result.ok(map(result.value));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(step, error, []));
  }
}

// ── Builder ───────────────────────────────────────────────────────────────────

function buildPlatform(deps: ResolvedDependencies): KnowledgePlatform {
  return {
    // ── Cross-cutting ────────────────────────────────────────────────

    process(input: ProcessKnowledgeInput) {
      return deps.processKnowledge.execute(input);
    },

    search(input: SearchKnowledgeInput) {
      return deps.searchKnowledge.execute(input);
    },

    // ── Contexts ─────────────────────────────────────────────────────

    async createContext(input: CreateContextInput) {
      try {
        const createResult = await deps.createContext.execute({
          id: input.id,
          name: input.name,
          description: input.description,
          language: input.language,
          requiredProfileId: input.requiredProfileId,
          createdBy: input.createdBy,
          tags: input.tags,
          attributes: input.attributes,
        });

        if (createResult.isFail()) {
          return Result.fail(
            KnowledgeError.fromStep(OperationStep.CreateContext, createResult.error, []),
          );
        }

        // Auto-activate for low-friction UX (Draft → Active)
        const activateResult = await deps.transitionContextState.execute({
          contextId: createResult.value.id.value,
          action: "activate",
        });

        if (activateResult.isFail()) {
          return Result.fail(
            KnowledgeError.fromStep(OperationStep.ActivateContext, activateResult.error, []),
          );
        }

        return Result.ok({
          contextId: activateResult.value.id.value,
          state: activateResult.value.state,
        });
      } catch (error) {
        return Result.fail(
          KnowledgeError.fromStep(OperationStep.CreateContext, error, []),
        );
      }
    },

    getContext(input: GetContextDetailsInput) {
      return deps.contextQueries.getDetail(input.contextId);
    },

    listContexts() {
      return deps.contextQueries.listSummary();
    },

    listContextRefs() {
      return deps.contextQueries.listRefs();
    },

    transitionContextState(input: TransitionContextStateInput) {
      return _wrap(
        OperationStep.TransitionState,
        () => {
          switch (input.targetState) {
            case "ACTIVE":
              return deps.transitionContextState.execute({ contextId: input.contextId, action: "activate" });
            case "DEPRECATED":
              return deps.transitionContextState.execute({ contextId: input.contextId, action: "deprecate", reason: input.reason ?? "" });
            case "ARCHIVED":
              return deps.transitionContextState.execute({ contextId: input.contextId, action: "archive" });
          }
        },
        (ctx) => ({ contextId: ctx.id.value, state: ctx.state }),
      );
    },

    async updateContextProfile(input: UpdateContextProfileInput) {
      try {
        const result = await deps.updateContextProfile.execute({
          contextId: input.contextId,
          profileId: input.profileId,
        });

        if (result.isFail()) {
          return Result.fail(
            KnowledgeError.fromStep(OperationStep.UpdateContextProfile, result.error, []),
          );
        }

        const updatedContext = result.value;
        let reconciled: { processedCount: number; failedCount: number } | undefined;

        // Auto-reconcile projections if context has active sources
        if (updatedContext.activeSources.length > 0) {
          const reconcileResult = await deps.reconcileProjections.execute({
            contextId: input.contextId,
            profileId: input.profileId,
          });

          if (reconcileResult.isOk()) {
            reconciled = {
              processedCount: reconcileResult.value.processedCount,
              failedCount: reconcileResult.value.failedCount,
            };
          }
        }

        return Result.ok({
          contextId: updatedContext.id.value,
          profileId: updatedContext.requiredProfileId,
          reconciled,
        });
      } catch (error) {
        return Result.fail(
          KnowledgeError.fromStep(OperationStep.UpdateContextProfile, error, []),
        );
      }
    },

    reconcileProjections(input: ReconcileProjectionsInput) {
      return deps.reconcileProjections.execute(input);
    },

    reconcileAllProfiles(input: ReconcileAllProfilesInput) {
      return deps.reconcileProjections.executeAllProfiles(input);
    },

    removeSourceFromContext(input: RemoveSourceInput) {
      return _wrap(
        OperationStep.RemoveSource,
        () => deps.removeSourceFromContext.execute({ contextId: input.contextId, sourceId: input.sourceId }),
        (ctx) => ({ contextId: ctx.id.value, version: ctx.currentVersion?.version ?? 0 }),
      );
    },

    linkContexts(input: LinkContextsInput) {
      return _wrap(
        OperationStep.Link,
        () => deps.linkContexts.execute({ fromContextId: input.sourceContextId, toContextId: input.targetContextId, relationship: input.relationshipType }),
        (v) => ({ sourceContextId: v.fromContextId, targetContextId: v.toContextId }),
      );
    },

    unlinkContexts(input: UnlinkContextsInput) {
      return _wrap(
        OperationStep.Unlink,
        () => deps.unlinkContexts.execute({ fromContextId: input.sourceContextId, toContextId: input.targetContextId }),
        (v) => ({ sourceContextId: v.fromContextId, targetContextId: v.toContextId }),
      );
    },

    getContextLineage(input: GetContextLineageInput) {
      return _wrap(
        OperationStep.Link,
        () => deps.lineageQueries.getLineage(input.contextId),
        (v) => ({
          contextId: v.contextId,
          traces: v.traces.map((t: any) => ({ ...t, createdAt: t.createdAt.toISOString() })),
        }),
      );
    },

    // ── Sources ──────────────────────────────────────────────────────

    listSources() {
      return _query(OperationStep.Ingestion, async () => {
        const sources = await deps.sourceQueries.listAll();
        return {
          sources: sources.map((s) => ({
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
      });
    },

    getSource(input: GetSourceInput) {
      return _query(OperationStep.Ingestion, async () => {
        const source = await deps.sourceQueries.getById(input.sourceId);
        if (!source) {
          throw { message: `Source ${input.sourceId} not found`, code: "SOURCE_NOT_FOUND" };
        }

        let extractedTextPreview: string | null = null;
        const textResult = await deps.sourceQueries.getExtractedText(input.sourceId);
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
            versions: source.versions.map((v) => ({
              version: v.version,
              contentHash: v.contentHash,
              extractedAt: v.extractedAt.toISOString(),
            })),
            extractedTextPreview,
          },
        };
      });
    },

    getSourceContexts(input: GetSourceContextsInput) {
      return deps.contextQueries.listBySource(input.sourceId);
    },

    processSourceAllProfiles(input: ProcessSourceAllProfilesInput) {
      return deps.processSourceAllProfiles.execute(input);
    },

    // ── Profiles ─────────────────────────────────────────────────────

    createProfile(input: CreateProcessingProfileInput) {
      return _wrap(
        OperationStep.Processing,
        () => deps.createProcessingProfile.execute({
          id: input.id,
          name: input.name,
          preparation: input.preparation,
          fragmentation: input.fragmentation,
          projection: input.projection,
        }),
        (v) => ({ profileId: v.profileId, version: v.version }),
      );
    },

    listProfiles() {
      return _query(OperationStep.Processing, async () => {
        const profiles = await deps.profileQueries.listAll();
        return {
          profiles: profiles.map((p) => ({
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
      });
    },

    updateProfile(input: UpdateProfileInput) {
      return _wrap(
        OperationStep.Processing,
        () => deps.updateProcessingProfile.execute({
          id: input.id,
          name: input.name,
          preparation: input.preparation,
          fragmentation: input.fragmentation,
          projection: input.projection,
        }),
        (v) => ({ profileId: v.profileId, version: v.version }),
      );
    },

    deprecateProfile(input: DeprecateProfileInput) {
      return _wrap(
        OperationStep.Processing,
        () => deps.deprecateProcessingProfile.execute({
          id: input.id,
          reason: input.reason,
        }),
        (v) => ({ profileId: v.profileId }),
      );
    },
  };
}

// ── Dependency resolver (unchanged logic) ─────────────────────────────────────

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
  const { ProfileQueries } = await import(
    "../../../contexts/semantic-processing/processing-profile/application/use-cases/ProfileQueries"
  );

  const createProcessingProfile = new CreateProcessingProfile(profileRepository, profileEventPublisher);
  const updateProcessingProfile = new UpdateProcessingProfile(profileRepository, profileEventPublisher);
  const deprecateProcessingProfile = new DeprecateProcessingProfile(profileRepository, profileEventPublisher);
  const profileQueries = new ProfileQueries(profileRepository);

  // ── Projection use cases ───────────────────────────────────────────
  const { GenerateProjection } = await import(
    "../../../contexts/semantic-processing/projection/application/use-cases/GenerateProjection"
  );
  const { ProjectionQueries } = await import(
    "../../../contexts/semantic-processing/projection/application/use-cases/ProjectionQueries"
  );
  const { CleanupProjections } = await import(
    "../../../contexts/semantic-processing/projection/application/use-cases/CleanupProjections"
  );

  const generateProjection = new GenerateProjection(
    projectionRepository,
    profileRepository,
    materializer,
    vectorWriteStore,
    projectionEventPublisher,
  );
  const projectionQueries = new ProjectionQueries(projectionRepository);
  const cleanupProjections = new CleanupProjections(projectionRepository, vectorWriteStore);

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
  const { RegisterSource } = await import(
    "../../../contexts/source-ingestion/source/application/use-cases/RegisterSource"
  );
  const { ExtractSource } = await import(
    "../../../contexts/source-ingestion/source/application/use-cases/ExtractSource"
  );
  const { IngestAndExtract } = await import(
    "../../../contexts/source-ingestion/source/application/use-cases/IngestAndExtract"
  );
  const { SourceQueries } = await import(
    "../../../contexts/source-ingestion/source/application/use-cases/SourceQueries"
  );
  const { IngestSource } = await import(
    "../../../contexts/source-ingestion/source/application/use-cases/IngestSource"
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

  // Resource use cases (internal)
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

  // Source query class (replaces GetSource, ListSources, GetSourceCount, GetExtractedText)
  const sourceQueries = new SourceQueries(sourceRepository, extractionJobRepository);

  // Source write use cases
  const registerSource = new RegisterSource(sourceRepository, sourceEventPublisher);
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
  const ingestSource = new IngestSource(ingestAndExtract, storeResource, registerExternalResource);

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
  const addSourceToContext = new AddSourceToContext(contextRepository, contextEventPublisher);
  const removeSourceFromContext = new RemoveSourceFromContext(contextRepository, contextEventPublisher);
  const transitionContextState = new TransitionContextState(contextRepository, contextEventPublisher);
  const updateContextProfile = new UpdateContextProfile(contextRepository, contextEventPublisher);

  // ── SourceIngestionAdapter (for ProcessSourceAllProfiles) ──────────
  const { SourceIngestionAdapter } = await import(
    "../../../contexts/semantic-processing/projection/infrastructure/adapters/SourceIngestionAdapter"
  );

  const sourceIngestionAdapter = new SourceIngestionAdapter(sourceQueries);

  // ── ProcessSourceAllProfiles ───────────────────────────────────────
  const { ProcessSourceAllProfiles } = await import(
    "../../../contexts/semantic-processing/projection/application/use-cases/ProcessSourceAllProfiles"
  );

  const processSourceAllProfiles = new ProcessSourceAllProfiles(
    profileQueries,
    projectionQueries,
    generateProjection,
    sourceIngestionAdapter,
  );

  // ── ProjectionOperationsAdapter ────────────────────────────────────
  const { ProjectionOperationsAdapter } = await import(
    "../../../contexts/context-management/context/infrastructure/adapters/ProjectionOperationsAdapter"
  );

  const projectionOperationsAdapter = new ProjectionOperationsAdapter(
    projectionQueries,
    cleanupProjections,
    generateProjection,
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

  const sourceTextAdapter = new SourceTextAdapter(sourceQueries);
  const sourceMetadataAdapter = new SourceMetadataAdapter(sourceQueries);
  const projectionStatsAdapter = new ProjectionStatsAdapter(projectionQueries);
  const activeProfilesAdapter = new ActiveProfilesAdapter(profileQueries);

  // ── ContextQueries (replaces GetContextDetails + ListContextsSummary + GetContext + ListContexts + GetContextsForSource) ──
  const { ContextQueries } = await import(
    "../../../contexts/context-management/context/application/use-cases/ContextQueries"
  );

  const contextQueries = new ContextQueries(
    contextRepository,
    sourceMetadataAdapter,
    projectionStatsAdapter,
  );

  // ── ReconcileProjections (merged with ReconcileAllProfiles) ────────
  const { ReconcileProjections: ReconcileProjectionsCM } = await import(
    "../../../contexts/context-management/context/application/use-cases/ReconcileProjections"
  );

  const reconcileProjections = new ReconcileProjectionsCM(
    contextRepository,
    projectionOperationsAdapter,
    sourceTextAdapter,
    activeProfilesAdapter,
  );

  // ── Lineage use cases ──────────────────────────────────────────────
  const { LinkContexts } = await import(
    "../../../contexts/context-management/lineage/application/use-cases/LinkContexts"
  );
  const { UnlinkContexts } = await import(
    "../../../contexts/context-management/lineage/application/use-cases/UnlinkContexts"
  );
  const { LineageQueries } = await import(
    "../../../contexts/context-management/lineage/application/use-cases/LineageQueries"
  );

  const linkContexts = new LinkContexts(lineageRepository);
  const unlinkContexts = new UnlinkContexts(lineageRepository);
  const lineageQueries = new LineageQueries(lineageRepository);

  // ── Knowledge-retrieval adapter ────────────────────────────────────
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

export async function createKnowledgePlatform(
  policy: OrchestratorPolicy,
): Promise<KnowledgePlatform> {
  const deps = await resolveDependencies(policy);
  return buildPlatform(deps);
}
