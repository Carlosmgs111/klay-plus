/**
 * Processing Profile Module Factory
 *
 * Entry point for creating the Processing Profile module.
 * Builds provider registries and delegates to Composer for wiring.
 *
 * @example
 * ```typescript
 * const { useCases, repository } = await processingProfileFactory({ provider: "server", dbPath: "./data" });
 * await useCases.createProcessingProfile.execute({ ... });
 * ```
 */

import type { ProcessingProfileInfrastructurePolicy } from "./infra-policies.js";
import type { ProcessingProfileUseCases } from "../application/index.js";
import type { ProcessingProfileRepository } from "../domain/ProcessingProfileRepository.js";

export interface ProcessingProfileFactoryResult {
  useCases: ProcessingProfileUseCases;
  /** Exposed for cross-module coordination (e.g., GenerateProjection lookups) */
  repository: ProcessingProfileRepository;
}

/**
 * Factory function for the ProcessingProfile module.
 * Resolves infrastructure and creates use cases.
 *
 * Returns both useCases (for facade) and repository (for cross-module wiring).
 */
export async function processingProfileFactory(
  policy: ProcessingProfileInfrastructurePolicy,
): Promise<ProcessingProfileFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder"
  );

  // ─── Repository Registry ─────────────────────────────────────────────────
  const repositoryRegistry = new ProviderRegistryBuilder<ProcessingProfileRepository>()
    .add("in-memory", {
      create: async () => {
        const { InMemoryProcessingProfileRepository } = await import(
          "../infrastructure/persistence/InMemoryProcessingProfileRepository.js"
        );
        return new InMemoryProcessingProfileRepository();
      },
    })
    .add("browser", {
      create: async (p) => {
        const { IndexedDBProcessingProfileRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBProcessingProfileRepository.js"
        );
        return new IndexedDBProcessingProfileRepository(
          (p.dbName as string) ?? "knowledge-platform",
        );
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBProcessingProfileRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBProcessingProfileRepository.js"
        );
        const filename = p.dbPath
          ? `${p.dbPath}/processing-profiles.db`
          : undefined;
        return new NeDBProcessingProfileRepository(filename);
      },
    })
    .build();

  // ─── Compose ─────────────────────────────────────────────────────────────
  const { ProcessingProfileComposer } = await import(
    "./ProcessingProfileComposer.js"
  );
  const infra = await ProcessingProfileComposer.resolve(policy, {
    repository: repositoryRegistry,
  });

  const { ProcessingProfileUseCases } = await import("../application/index.js");
  const { InMemoryEventPublisher } = await import(
    "../../../../platform/eventing/InMemoryEventPublisher"
  );

  const eventPublisher = new InMemoryEventPublisher();
  const useCases = new ProcessingProfileUseCases(
    infra.repository,
    eventPublisher,
  );

  return { useCases, repository: infra.repository };
}
