import type { ProcessingProfileRepository } from "../processing-profile/domain/ProcessingProfileRepository";
import type { EventPublisher } from "../../../shared/domain/EventPublisher";
import type { VectorEntry } from "../../../shared/vector/VectorEntry";
import type { ProjectionInfrastructurePolicy, ResolvedProjectionInfra } from "../projection/composition/factory";
import type { ProcessingProfileInfrastructurePolicy } from "../processing-profile/composition/factory";
import { resolveConfigProvider } from "../../../config/ConfigProvider";
import type { ConfigStore } from "../../../config/ConfigStore";
import type { SourceIngestionPort } from "../projection/application/ports/SourceIngestionPort";
import type { CreateProcessingProfile as CreateProcessingProfileType } from "../processing-profile/application/use-cases/CreateProcessingProfile";
import type { UpdateProcessingProfile as UpdateProcessingProfileType } from "../processing-profile/application/use-cases/UpdateProcessingProfile";
import type { DeprecateProcessingProfile as DeprecateProcessingProfileType } from "../processing-profile/application/use-cases/DeprecateProcessingProfile";
import type { ProfileQueries as ProfileQueriesType } from "../processing-profile/application/use-cases/ProfileQueries";
import type { GenerateProjection as GenerateProjectionType } from "../projection/application/use-cases/GenerateProjection";
import type { ProjectionQueries as ProjectionQueriesType } from "../projection/application/use-cases/ProjectionQueries";
import type { CleanupProjections as CleanupProjectionsType } from "../projection/application/use-cases/CleanupProjections";
import type { ProcessSourceAllProfiles as ProcessSourceAllProfilesType } from "../projection/application/use-cases/ProcessSourceAllProfiles";

export interface VectorStoreConfig {
  dbPath?: string;
  dbName?: string;
  sharedEntries?: Map<string, VectorEntry>;
}

interface ProjectionOverrides {
  provider?: string;
  dbPath?: string;
  dbName?: string;
  embeddingDimensions?: number;
  webLLMModelId?: string;
  embeddingProvider?: string;
  embeddingModel?: string;
  configOverrides?: Record<string, string>;
}

interface ProcessingProfileOverrides {
  provider?: string;
  dbPath?: string;
  dbName?: string;
}

export interface SemanticProcessingServicePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  embeddingDimensions?: number;
  embeddingProvider?: string;
  embeddingModel?: string;
  defaultChunkingStrategy?: string;
  vectorStoreProvider?: string;
  overrides?: {
    projection?: ProjectionOverrides;
    processingProfile?: ProcessingProfileOverrides;
  };
  configOverrides?: Record<string, string>;
  configStore?: ConfigStore;
}

export interface ResolvedSemanticProcessingModules {
  projectionInfra: ResolvedProjectionInfra;
  profileRepository: ProcessingProfileRepository;
  profileEventPublisher: EventPublisher;
  vectorStoreConfig: VectorStoreConfig;
}

export async function resolveSemanticProcessingModules(
  policy: SemanticProcessingServicePolicy,
): Promise<ResolvedSemanticProcessingModules> {
  const config = await resolveConfigProvider(policy);

  const resolvedDbPath =
    policy.dbPath ?? config.getOrDefault("KLAY_DB_PATH", "./data");
  const resolvedDbName =
    policy.dbName ?? config.getOrDefault("KLAY_DB_NAME", "semantic-processing");

  const profilePolicy: ProcessingProfileInfrastructurePolicy = {
    provider: policy.overrides?.processingProfile?.provider ?? policy.provider,
    dbPath:
      policy.overrides?.processingProfile?.dbPath ?? resolvedDbPath,
    dbName:
      policy.overrides?.processingProfile?.dbName ?? resolvedDbName,
  };

  const processingProfileResult = await import(
    "../processing-profile/composition/factory"
  ).then((m) => m.processingProfileFactory(profilePolicy));

  const projectionPolicy: ProjectionInfrastructurePolicy = {
    provider: policy.overrides?.projection?.provider ?? policy.provider,
    dbPath:
      policy.overrides?.projection?.dbPath ?? resolvedDbPath,
    dbName:
      policy.overrides?.projection?.dbName ?? resolvedDbName,
    embeddingDimensions:
      policy.overrides?.projection?.embeddingDimensions ??
      policy.embeddingDimensions,

    embeddingProvider:
      policy.overrides?.projection?.embeddingProvider ??
      policy.embeddingProvider,
    embeddingModel:
      policy.overrides?.projection?.embeddingModel ??
      policy.embeddingModel,

    vectorStoreProvider: policy.vectorStoreProvider,
    configOverrides: policy.configOverrides,
    configStore: policy.configStore,
  };

  const projectionResult = await import(
    "../projection/composition/factory"
  ).then((m) =>
    m.projectionFactory(projectionPolicy, processingProfileResult.repository)
  );

  const vectorStoreConfig: VectorStoreConfig = {
    dbPath: projectionPolicy.dbPath
      ? `${projectionPolicy.dbPath}/vector-entries.db`
      : undefined,
    dbName: projectionPolicy.dbName,
  };

  if (policy.provider === "in-memory") {
    const writeStore = projectionResult.infra.vectorWriteStore as any;
    if (writeStore.sharedEntries) {
      vectorStoreConfig.sharedEntries = writeStore.sharedEntries;
    }
  }

  return {
    projectionInfra: projectionResult.infra,
    profileRepository: processingProfileResult.repository,
    profileEventPublisher: processingProfileResult.eventPublisher,
    vectorStoreConfig,
  };
}

// ── Self-contained context factory ──────────────────────────────────

export interface SemanticProcessingCapabilities {
  createProcessingProfile: CreateProcessingProfileType;
  updateProcessingProfile: UpdateProcessingProfileType;
  deprecateProcessingProfile: DeprecateProcessingProfileType;
  profileQueries: ProfileQueriesType;
  processSourceAllProfiles: ProcessSourceAllProfilesType;
  projectionQueries: ProjectionQueriesType;
  generateProjection: GenerateProjectionType;
  cleanupProjections: CleanupProjectionsType;
  vectorStoreConfig: VectorStoreConfig;
}

export async function createSemanticProcessing(
  config: SemanticProcessingServicePolicy,
  sourceIngestionPort: SourceIngestionPort,
): Promise<SemanticProcessingCapabilities> {
  const modules = await resolveSemanticProcessingModules(config);

  const { repository: projectionRepository, materializer, vectorWriteStore, eventPublisher: projectionEventPublisher } =
    modules.projectionInfra;

  const [
    { CreateProcessingProfile },
    { UpdateProcessingProfile },
    { DeprecateProcessingProfile },
    { ProfileQueries },
    { GenerateProjection },
    { ProjectionQueries },
    { CleanupProjections },
    { ProcessSourceAllProfiles },
  ] = await Promise.all([
    import("../processing-profile/application/use-cases/CreateProcessingProfile"),
    import("../processing-profile/application/use-cases/UpdateProcessingProfile"),
    import("../processing-profile/application/use-cases/DeprecateProcessingProfile"),
    import("../processing-profile/application/use-cases/ProfileQueries"),
    import("../projection/application/use-cases/GenerateProjection"),
    import("../projection/application/use-cases/ProjectionQueries"),
    import("../projection/application/use-cases/CleanupProjections"),
    import("../projection/application/use-cases/ProcessSourceAllProfiles"),
  ]);

  const createProcessingProfile = new CreateProcessingProfile(modules.profileRepository, modules.profileEventPublisher);
  const updateProcessingProfile = new UpdateProcessingProfile(modules.profileRepository, modules.profileEventPublisher);
  const deprecateProcessingProfile = new DeprecateProcessingProfile(modules.profileRepository, modules.profileEventPublisher);
  const profileQueries = new ProfileQueries(modules.profileRepository);

  const generateProjection = new GenerateProjection(
    projectionRepository,
    modules.profileRepository,
    materializer,
    vectorWriteStore,
    projectionEventPublisher,
  );
  const projectionQueries = new ProjectionQueries(projectionRepository);
  const cleanupProjections = new CleanupProjections(projectionRepository, vectorWriteStore);

  const processSourceAllProfiles = new ProcessSourceAllProfiles(
    profileQueries,
    projectionQueries,
    generateProjection,
    sourceIngestionPort,
  );

  return {
    createProcessingProfile,
    updateProcessingProfile,
    deprecateProcessingProfile,
    profileQueries,
    processSourceAllProfiles,
    projectionQueries,
    generateProjection,
    cleanupProjections,
    vectorStoreConfig: modules.vectorStoreConfig,
  };
}
