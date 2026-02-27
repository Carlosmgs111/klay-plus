import type { ExtractionUseCases } from "../../extraction/application";
import type { SourceRepository } from "../../source/domain/SourceRepository";
import type { ResourceRepository } from "../../resource/domain/ResourceRepository";
import type { ResourceStorage } from "../../resource/domain/ResourceStorage";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";
import type { SourceInfrastructurePolicy } from "../../source/composition/factory";
import type { ExtractionInfrastructurePolicy } from "../../extraction/composition/factory";
import type { ResourceInfrastructurePolicy } from "../../resource/composition/factory";
import { resolveConfigProvider } from "../../../../platform/config/resolveConfigProvider";

interface SourceOverrides {
  provider?: string;
  dbPath?: string;
  dbName?: string;
}

interface ExtractionOverrides {
  provider?: string;
  dbPath?: string;
  dbName?: string;
}

interface ResourceOverrides {
  provider?: string;
  dbPath?: string;
  dbName?: string;
  uploadPath?: string;
}

export interface SourceIngestionFacadePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  uploadPath?: string;
  overrides?: {
    source?: SourceOverrides;
    extraction?: ExtractionOverrides;
    resource?: ResourceOverrides;
  };
  configOverrides?: Record<string, string>;
}

export interface ResolvedSourceIngestionModules {
  extraction: ExtractionUseCases;
  sourceRepository: SourceRepository;
  sourceEventPublisher: EventPublisher;
  resourceRepository: ResourceRepository;
  resourceStorage: ResourceStorage;
  resourceStorageProvider: string;
  resourceEventPublisher: EventPublisher;
}

export async function resolveSourceIngestionModules(
  policy: SourceIngestionFacadePolicy,
): Promise<ResolvedSourceIngestionModules> {
  const config = await resolveConfigProvider(policy);

  const sourcePolicy: SourceInfrastructurePolicy = {
    provider: policy.overrides?.source?.provider ?? policy.provider,
    dbPath: policy.overrides?.source?.dbPath ??
            policy.dbPath ??
            config.getOrDefault("KLAY_DB_PATH", "./data"),
    dbName: policy.overrides?.source?.dbName ??
            policy.dbName ??
            config.getOrDefault("KLAY_DB_NAME", "knowledge-platform"),
  };

  const extractionPolicy: ExtractionInfrastructurePolicy = {
    provider: policy.overrides?.extraction?.provider ?? policy.provider,
    dbPath: policy.overrides?.extraction?.dbPath ??
            policy.dbPath ??
            config.getOrDefault("KLAY_DB_PATH", "./data"),
    dbName: policy.overrides?.extraction?.dbName ??
            policy.dbName ??
            config.getOrDefault("KLAY_DB_NAME", "knowledge-platform"),
  };

  const resourcePolicy: ResourceInfrastructurePolicy = {
    provider: policy.overrides?.resource?.provider ?? policy.provider,
    dbPath: policy.overrides?.resource?.dbPath ??
            policy.dbPath ??
            config.getOrDefault("KLAY_DB_PATH", "./data"),
    dbName: policy.overrides?.resource?.dbName ??
            policy.dbName ??
            config.getOrDefault("KLAY_DB_NAME", "knowledge-platform"),
    uploadPath: policy.overrides?.resource?.uploadPath ??
                policy.uploadPath ??
                config.getOrDefault("KLAY_UPLOAD_PATH", "./uploads"),
  };

  const [sourceResult, extractionResult, resourceResult] = await Promise.all([
    import("../../source/composition/factory").then((m) =>
      m.sourceFactory(sourcePolicy),
    ),
    import("../../extraction/composition/factory").then((m) =>
      m.extractionFactory(extractionPolicy),
    ),
    import("../../resource/composition/factory").then((m) =>
      m.resourceFactory(resourcePolicy),
    ),
  ]);

  return {
    extraction: extractionResult.useCases,
    sourceRepository: sourceResult.infra.repository,
    sourceEventPublisher: sourceResult.infra.eventPublisher,
    resourceRepository: resourceResult.infra.repository,
    resourceStorage: resourceResult.infra.storage,
    resourceStorageProvider: resourceResult.infra.storageProvider,
    resourceEventPublisher: resourceResult.infra.eventPublisher,
  };
}
