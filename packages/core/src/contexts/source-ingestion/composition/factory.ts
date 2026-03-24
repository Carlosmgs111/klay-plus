import type { ExtractionUseCases } from "../extraction/application";
import type { ExtractionJobRepository } from "../extraction/domain/ExtractionJobRepository";
import type { SourceRepository } from "../source/domain/SourceRepository";
import type { ResourceRepository } from "../resource/domain/ResourceRepository";
import type { ResourceStorage } from "../resource/domain/ResourceStorage";
import type { EventPublisher } from "../../../shared/domain/EventPublisher";
import type { SourceInfrastructurePolicy } from "../source/composition/factory";
import type { ExtractionInfrastructurePolicy } from "../extraction/composition/factory";
import type { ResourceInfrastructurePolicy } from "../resource/composition/factory";
import { resolveConfigProvider } from "../../../config/ConfigProvider";
import type { ConfigStore } from "../../../config/ConfigStore";
import type { SourceQueries as SourceQueriesType } from "../source/application/use-cases/SourceQueries";
import type { IngestAndExtract as IngestAndExtractType } from "../source/application/use-cases/IngestAndExtract";

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

export interface SourceIngestionServicePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  uploadPath?: string;
  documentStorageProvider?: string;
  overrides?: {
    source?: SourceOverrides;
    extraction?: ExtractionOverrides;
    resource?: ResourceOverrides;
  };
  configOverrides?: Record<string, string>;
  configStore?: ConfigStore;
}

export interface ResolvedSourceIngestionModules {
  extraction: ExtractionUseCases;
  extractionJobRepository: ExtractionJobRepository;
  sourceRepository: SourceRepository;
  sourceEventPublisher: EventPublisher;
  resourceRepository: ResourceRepository;
  resourceStorage: ResourceStorage;
  resourceStorageProvider: string;
  resourceEventPublisher: EventPublisher;
}

export async function resolveSourceIngestionModules(
  policy: SourceIngestionServicePolicy,
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
    provider: policy.overrides?.resource?.provider ?? policy.documentStorageProvider ?? policy.provider,
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
    import("../source/composition/factory").then((m) =>
      m.sourceFactory(sourcePolicy),
    ),
    import("../extraction/composition/factory").then((m) =>
      m.extractionFactory(extractionPolicy),
    ),
    import("../resource/composition/factory").then((m) =>
      m.resourceFactory(resourcePolicy),
    ),
  ]);

  return {
    extraction: extractionResult.useCases,
    extractionJobRepository: extractionResult.infra.repository,
    sourceRepository: sourceResult.infra.repository,
    sourceEventPublisher: sourceResult.infra.eventPublisher,
    resourceRepository: resourceResult.infra.repository,
    resourceStorage: resourceResult.infra.storage,
    resourceStorageProvider: resourceResult.infra.storageProvider,
    resourceEventPublisher: resourceResult.infra.eventPublisher,
  };
}

// ── Self-contained context factory ──────────────────────────────────

export interface SourceIngestionCapabilities {
  sourceQueries: SourceQueriesType;
  ingestAndExtract: IngestAndExtractType;
}

export async function createSourceIngestion(
  config: SourceIngestionServicePolicy,
): Promise<SourceIngestionCapabilities> {
  const modules = await resolveSourceIngestionModules(config);

  const [
    { StoreResource },
    { RegisterExternalResource },
    { DeleteResource },
    { GetResource },
    { SourceQueries },
    { RegisterSource },
    { ExtractSource },
    { IngestAndExtract },
    { IngestSource },
  ] = await Promise.all([
    import("../resource/application/use-cases/StoreResource"),
    import("../resource/application/use-cases/RegisterExternalResource"),
    import("../resource/application/use-cases/DeleteResource"),
    import("../resource/application/use-cases/GetResource"),
    import("../source/application/use-cases/SourceQueries"),
    import("../source/application/use-cases/RegisterSource"),
    import("../source/application/use-cases/ExtractSource"),
    import("../source/application/use-cases/IngestAndExtract"),
    import("../source/application/use-cases/IngestSource"),
  ]);

  const storeResource = new StoreResource(
    modules.resourceRepository,
    modules.resourceStorage,
    modules.resourceStorageProvider,
    modules.resourceEventPublisher,
  );
  const registerExternalResource = new RegisterExternalResource(
    modules.resourceRepository,
    modules.resourceEventPublisher,
  );

  const sourceQueries = new SourceQueries(modules.sourceRepository, modules.extractionJobRepository);
  const ingestAndExtract = new IngestAndExtract(
    modules.sourceRepository,
    modules.sourceEventPublisher,
    modules.extraction.executeExtraction,
  );

  return { sourceQueries, ingestAndExtract };
}
