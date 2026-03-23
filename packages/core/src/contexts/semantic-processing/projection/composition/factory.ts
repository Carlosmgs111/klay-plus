import type { SemanticProjectionRepository } from "../domain/SemanticProjectionRepository";
import type { VectorWriteStore } from "../domain/ports/VectorWriteStore";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";
import type { ProcessingProfileRepository } from "../../processing-profile/domain/ProcessingProfileRepository";
import type { ProcessingProfileMaterializer } from "./ProcessingProfileMaterializer";
import type { ConfigStore } from "../../../../config/ConfigStore";

export interface ProjectionInfrastructurePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  embeddingDimensions?: number;
  webLLMModelId?: string;
  embeddingProvider?: string;
  embeddingModel?: string;
  vectorStoreProvider?: string;
  configOverrides?: Record<string, string>;
  configStore?: ConfigStore;
  [key: string]: unknown;
}

export interface ResolvedProjectionInfra {
  repository: SemanticProjectionRepository;
  profileRepository: ProcessingProfileRepository;
  materializer: ProcessingProfileMaterializer;
  vectorWriteStore: VectorWriteStore;
  eventPublisher: EventPublisher;
}

export interface ProjectionFactoryResult {
  infra: ResolvedProjectionInfra;
}

async function resolveRepository(policy: ProjectionInfrastructurePolicy): Promise<SemanticProjectionRepository> {
  switch (policy.provider) {
    case "browser": {
      const { IndexedDBSemanticProjectionRepository } = await import(
        "../infrastructure/persistence/indexeddb/IndexedDBSemanticProjectionRepository"
      );
      return new IndexedDBSemanticProjectionRepository(
        (policy.dbName as string) ?? "knowledge-platform",
      );
    }
    case "server": {
      const { NeDBSemanticProjectionRepository } = await import(
        "../infrastructure/persistence/nedb/NeDBSemanticProjectionRepository"
      );
      const filename = policy.dbPath
        ? `${policy.dbPath}/semantic-projections.db`
        : undefined;
      return new NeDBSemanticProjectionRepository(filename);
    }
    default: {
      const { InMemorySemanticProjectionRepository } = await import(
        "../infrastructure/persistence/InMemorySemanticProjectionRepository"
      );
      return new InMemorySemanticProjectionRepository();
    }
  }
}

async function resolveVectorWriteStore(provider: string, policy: ProjectionInfrastructurePolicy): Promise<VectorWriteStore> {
  switch (provider) {
    case "browser": {
      const { IndexedDBVectorWriteStore } = await import(
        "../infrastructure/adapters/IndexedDBVectorWriteStore"
      );
      const dbName = (policy.dbName as string) ?? "knowledge-platform";
      return new IndexedDBVectorWriteStore(dbName);
    }
    case "server": {
      const { NeDBVectorWriteStore } = await import(
        "../infrastructure/adapters/NeDBVectorWriteStore"
      );
      const filename = policy.dbPath
        ? `${policy.dbPath}/vector-entries.db`
        : undefined;
      return new NeDBVectorWriteStore(filename);
    }
    default: {
      const { InMemoryVectorWriteStore } = await import(
        "../../../../shared/vector/InMemoryVectorWriteStore"
      );
      return new InMemoryVectorWriteStore();
    }
  }
}

export async function projectionFactory(
  policy: ProjectionInfrastructurePolicy,
  profileRepository: ProcessingProfileRepository,
): Promise<ProjectionFactoryResult> {
  const { ProcessingProfileMaterializer } = await import(
    "./ProcessingProfileMaterializer"
  );
  const { EmbeddingStrategyResolver } = await import(
    "./EmbeddingStrategyResolver"
  );
  const { InMemoryEventPublisher } = await import(
    "../../../../shared/InMemoryEventPublisher"
  );

  const vectorStoreProvider = policy.vectorStoreProvider ?? policy.provider;

  const [repository, vectorWriteStore] = await Promise.all([
    resolveRepository(policy),
    resolveVectorWriteStore(vectorStoreProvider, policy),
  ]);

  const eventPublisher = new InMemoryEventPublisher();
  const embeddingResolver = new EmbeddingStrategyResolver(policy);
  const materializer = new ProcessingProfileMaterializer(embeddingResolver);

  const infra: ResolvedProjectionInfra = {
    repository,
    profileRepository,
    materializer,
    vectorWriteStore,
    eventPublisher,
  };

  return { infra };
}
