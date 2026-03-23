import type { ProcessingProfileRepository } from "../processing-profile/domain/ProcessingProfileRepository";
import type { EventPublisher } from "../../../shared/domain/EventPublisher";
import type { VectorEntry } from "../../../platform/vector/VectorEntry";
import type { ProjectionInfrastructurePolicy, ResolvedProjectionInfra } from "../projection/composition/factory";
import type { ProcessingProfileInfrastructurePolicy } from "../processing-profile/composition/factory";
import { resolveConfigProvider } from "../../../platform/config/ConfigProvider";
import type { ConfigStore } from "../../../platform/config/ConfigStore";

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
