/**
 * Resource Module Factory
 *
 * Entry point for creating the Resource module.
 * Builds provider registries and delegates to Composer for wiring.
 *
 * @example
 * ```typescript
 * const { useCases, infra } = await resourceFactory({ provider: "server", dbPath: "./data", uploadPath: "./uploads" });
 * await useCases.storeResource.execute({ ... });
 * ```
 */

import type { ResourceInfrastructurePolicy, ResolvedResourceInfra } from "./infra-policies.js";
import type { ResourceUseCases } from "../application/index.js";
import type { ResourceRepository } from "../domain/ResourceRepository.js";
import type { ResourceStorage } from "../domain/ResourceStorage.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";

// ─── Factory Result Contract ─────────────────────────────────────────────────

export interface ResourceFactoryResult {
  /** Assembled use cases ready for consumption */
  useCases: ResourceUseCases;
  /**
   * Resolved infrastructure.
   * Exposed for facade coordination (e.g., repository access).
   * Should NOT be used directly by external consumers.
   */
  infra: ResolvedResourceInfra;
}

// ─── Factory Function ────────────────────────────────────────────────────────

export async function resourceFactory(
  policy: ResourceInfrastructurePolicy,
): Promise<ResourceFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder"
  );

  // ─── Repository Registry ─────────────────────────────────────────────────
  const repositoryRegistry = new ProviderRegistryBuilder<ResourceRepository>()
    .add("in-memory", {
      create: async () => {
        const { InMemoryResourceRepository } = await import(
          "../infrastructure/persistence/InMemoryResourceRepository.js"
        );
        return new InMemoryResourceRepository();
      },
    })
    .add("browser", {
      create: async (p) => {
        const { IndexedDBResourceRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBResourceRepository.js"
        );
        return new IndexedDBResourceRepository(
          (p.dbName as string) ?? "knowledge-platform",
        );
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBResourceRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBResourceRepository.js"
        );
        const filename = p.dbPath ? `${p.dbPath}/resources.db` : undefined;
        return new NeDBResourceRepository(filename);
      },
    })
    .build();

  // ─── Storage Registry ──────────────────────────────────────────────────────
  const storageRegistry = new ProviderRegistryBuilder<ResourceStorage>()
    .add("in-memory", {
      create: async () => {
        const { InMemoryResourceStorage } = await import(
          "../infrastructure/storage/InMemoryResourceStorage.js"
        );
        return new InMemoryResourceStorage();
      },
    })
    .add("browser", {
      create: async () => {
        // Browser uses in-memory storage (IndexedDB for metadata, no file upload)
        const { InMemoryResourceStorage } = await import(
          "../infrastructure/storage/InMemoryResourceStorage.js"
        );
        return new InMemoryResourceStorage();
      },
    })
    .add("server", {
      create: async (p) => {
        const { LocalFileResourceStorage } = await import(
          "../infrastructure/storage/LocalFileResourceStorage.js"
        );
        const uploadPath = (p.uploadPath as string) ??
                           (p.dbPath ? `${p.dbPath}/uploads` : "./uploads");
        return new LocalFileResourceStorage(uploadPath);
      },
    })
    .build();

  // ─── EventPublisher Registry ───────────────────────────────────────────────
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
  const { ResourceComposer } = await import("./ResourceComposer.js");
  const infra = await ResourceComposer.resolve(policy, {
    repository: repositoryRegistry,
    storage: storageRegistry,
    eventPublisher: eventPublisherRegistry,
  });

  const { ResourceUseCases } = await import("../application/index.js");
  const useCases = new ResourceUseCases(
    infra.repository,
    infra.storage,
    infra.storageProvider,
    infra.eventPublisher,
  );

  return { useCases, infra };
}
