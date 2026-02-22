/**
 * Projection Module Factory
 *
 * Entry point for creating the Projection module.
 * Builds provider registries and delegates to Composer for wiring.
 *
 * Now requires a ProcessingProfileRepository from the processing-profile module
 * for cross-module wiring — GenerateProjection looks up profiles at runtime.
 *
 * @example
 * ```typescript
 * const { useCases, infra } = await projectionFactory(policy, profileRepository);
 * await useCases.generateProjection.execute({ ... });
 * ```
 */

import type {
  ProjectionInfrastructurePolicy,
  ResolvedProjectionInfra,
} from "./infra-policies.js";
import type { ProjectionUseCases } from "../application/index.js";
import type { ProcessingProfileRepository } from "../../processing-profile/domain/ProcessingProfileRepository.js";
import type { SemanticProjectionRepository } from "../domain/SemanticProjectionRepository.js";
import type { VectorWriteStore } from "../domain/ports/VectorWriteStore.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";

// ─── Factory Result Contract ────────────────────────────────────────────────

export interface ProjectionFactoryResult {
  /** Assembled use cases ready for consumption */
  useCases: ProjectionUseCases;
  /**
   * Resolved infrastructure.
   * Exposed for facade/orchestrator coordination (e.g., vector store access).
   * Should NOT be used directly by external consumers.
   */
  infra: ResolvedProjectionInfra;
}

// ─── Factory Function ───────────────────────────────────────────────────────

export async function projectionFactory(
  policy: ProjectionInfrastructurePolicy,
  profileRepository: ProcessingProfileRepository,
): Promise<ProjectionFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder"
  );

  // ─── Repository Registry ─────────────────────────────────────────────────
  const repositoryRegistry = new ProviderRegistryBuilder<SemanticProjectionRepository>()
    .add("in-memory", {
      create: async () => {
        const { InMemorySemanticProjectionRepository } = await import(
          "../infrastructure/persistence/InMemorySemanticProjectionRepository.js"
        );
        return new InMemorySemanticProjectionRepository();
      },
    })
    .add("browser", {
      create: async (p) => {
        const { IndexedDBSemanticProjectionRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBSemanticProjectionRepository.js"
        );
        return new IndexedDBSemanticProjectionRepository(
          (p.dbName as string) ?? "knowledge-platform",
        );
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBSemanticProjectionRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBSemanticProjectionRepository.js"
        );
        const filename = p.dbPath
          ? `${p.dbPath}/semantic-projections.db`
          : undefined;
        return new NeDBSemanticProjectionRepository(filename);
      },
    })
    .build();

  // ─── VectorWriteStore Registry ───────────────────────────────────────────
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
          "../infrastructure/adapters/IndexedDBVectorWriteStore.js"
        );
        const dbName = (p.dbName as string) ?? "knowledge-platform";
        return new IndexedDBVectorWriteStore(dbName);
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBVectorWriteStore } = await import(
          "../infrastructure/adapters/NeDBVectorWriteStore.js"
        );
        const filename = p.dbPath
          ? `${p.dbPath}/vector-entries.db`
          : undefined;
        return new NeDBVectorWriteStore(filename);
      },
    })
    .build();

  // ─── EventPublisher Registry ─────────────────────────────────────────────
  const eventPublisherRegistry = new ProviderRegistryBuilder<EventPublisher>()
    .add("in-memory", {
      create: async () => {
        const { InMemoryEventPublisher } = await import(
          "../../../../platform/eventing/InMemoryEventPublisher"
        );
        return new InMemoryEventPublisher();
      },
    })
    .add("browser", {
      create: async () => {
        const { InMemoryEventPublisher } = await import(
          "../../../../platform/eventing/InMemoryEventPublisher"
        );
        return new InMemoryEventPublisher();
      },
    })
    .add("server", {
      create: async () => {
        const { InMemoryEventPublisher } = await import(
          "../../../../platform/eventing/InMemoryEventPublisher"
        );
        return new InMemoryEventPublisher();
      },
    })
    .build();

  // ─── Compose ─────────────────────────────────────────────────────────────
  const { ProjectionComposer } = await import("./ProjectionComposer.js");
  const infra = await ProjectionComposer.resolve(policy, profileRepository, {
    repository: repositoryRegistry,
    vectorWriteStore: vectorWriteStoreRegistry,
    eventPublisher: eventPublisherRegistry,
  });

  // 2. Construct use cases with resolved dependencies
  const { ProjectionUseCases } = await import("../application/index.js");
  const useCases = new ProjectionUseCases(
    infra.repository,
    infra.profileRepository,
    infra.materializer,
    infra.vectorWriteStore,
    infra.eventPublisher,
  );

  return { useCases, infra };
}
