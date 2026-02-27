import type { SemanticProjectionRepository } from "../domain/SemanticProjectionRepository";
import type { VectorWriteStore } from "../domain/ports/VectorWriteStore";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";
import type { ProcessingProfileRepository } from "../../processing-profile/domain/ProcessingProfileRepository";
import type { ProcessingProfileMaterializer } from "./ProcessingProfileMaterializer";
import type { ProjectionUseCases } from "../application";

export interface ProjectionInfrastructurePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  embeddingDimensions?: number;
  webLLMModelId?: string;
  embeddingProvider?: string;
  embeddingModel?: string;
  configOverrides?: Record<string, string>;
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
  useCases: ProjectionUseCases;
  infra: ResolvedProjectionInfra;
}

export async function projectionFactory(
  policy: ProjectionInfrastructurePolicy,
  profileRepository: ProcessingProfileRepository,
): Promise<ProjectionFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder"
  );

  const repositoryRegistry = new ProviderRegistryBuilder<SemanticProjectionRepository>()
    .add("in-memory", {
      create: async () => {
        const { InMemorySemanticProjectionRepository } = await import(
          "../infrastructure/persistence/InMemorySemanticProjectionRepository"
        );
        return new InMemorySemanticProjectionRepository();
      },
    })
    .add("browser", {
      create: async (p) => {
        const { IndexedDBSemanticProjectionRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBSemanticProjectionRepository"
        );
        return new IndexedDBSemanticProjectionRepository(
          (p.dbName as string) ?? "knowledge-platform",
        );
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBSemanticProjectionRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBSemanticProjectionRepository"
        );
        const filename = p.dbPath
          ? `${p.dbPath}/semantic-projections.db`
          : undefined;
        return new NeDBSemanticProjectionRepository(filename);
      },
    })
    .build();

  const vectorWriteStoreRegistry = new ProviderRegistryBuilder<VectorWriteStore>()
    .add("in-memory", {
      create: async () => {
        const { InMemoryVectorWriteStore } = await import(
          "../../../../platform/vector/InMemoryVectorWriteStore"
        );
        return new InMemoryVectorWriteStore();
      },
    })
    .add("browser", {
      create: async (p) => {
        const { IndexedDBVectorWriteStore } = await import(
          "../infrastructure/adapters/IndexedDBVectorWriteStore"
        );
        const dbName = (p.dbName as string) ?? "knowledge-platform";
        return new IndexedDBVectorWriteStore(dbName);
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBVectorWriteStore } = await import(
          "../infrastructure/adapters/NeDBVectorWriteStore"
        );
        const filename = p.dbPath
          ? `${p.dbPath}/vector-entries.db`
          : undefined;
        return new NeDBVectorWriteStore(filename);
      },
    })
    .build();

  const { createEventPublisherRegistry } = await import(
    "../../../../platform/composition/createEventPublisherRegistry"
  );
  const eventPublisherRegistry = createEventPublisherRegistry();

  const { ProcessingProfileMaterializer } = await import(
    "./ProcessingProfileMaterializer"
  );

  const [repository, vectorWriteStore, eventPublisher] = await Promise.all([
    repositoryRegistry.resolve(policy.provider).create(policy),
    vectorWriteStoreRegistry.resolve(policy.provider).create(policy),
    eventPublisherRegistry.resolve(policy.provider).create(policy),
  ]);

  const materializer = new ProcessingProfileMaterializer(policy);

  const infra: ResolvedProjectionInfra = {
    repository,
    profileRepository,
    materializer,
    vectorWriteStore,
    eventPublisher,
  };

  const { ProjectionUseCases } = await import("../application");
  const useCases = new ProjectionUseCases(
    infra.repository,
    infra.profileRepository,
    infra.materializer,
    infra.vectorWriteStore,
    infra.eventPublisher,
  );

  return { useCases, infra };
}
