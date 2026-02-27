/**
 * Extraction Module Factory
 *
 * Entry point for creating the Extraction module.
 * Builds provider registries and delegates to Composer for wiring.
 *
 * @example
 * ```typescript
 * const { useCases, infra } = await extractionFactory({ provider: "server", dbPath: "./data" });
 * await useCases.executeExtraction.execute({ ... });
 * ```
 */

import type { ExtractionInfrastructurePolicy, ResolvedExtractionInfra } from "./infra-policies.js";
import type { ExtractionUseCases } from "../application/index.js";
import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository.js";
export interface ExtractionFactoryResult {
  /** Assembled use cases ready for consumption */
  useCases: ExtractionUseCases;
  /**
   * Resolved infrastructure.
   * Exposed for facade coordination if needed.
   * Should NOT be used directly by external consumers.
   */
  infra: ResolvedExtractionInfra;
}

export async function extractionFactory(
  policy: ExtractionInfrastructurePolicy,
): Promise<ExtractionFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder.js"
  );

  const repositoryRegistry = new ProviderRegistryBuilder<ExtractionJobRepository>()
    .add("in-memory", {
      create: async () => {
        const { InMemoryExtractionJobRepository } = await import(
          "../infrastructure/persistence/InMemoryExtractionJobRepository.js"
        );
        return new InMemoryExtractionJobRepository();
      },
    })
    .add("browser", {
      create: async (p) => {
        const { IndexedDBExtractionJobRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBExtractionJobRepository.js"
        );
        return new IndexedDBExtractionJobRepository(
          (p.dbName as string) ?? "knowledge-platform",
        );
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBExtractionJobRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBExtractionJobRepository.js"
        );
        const filename = p.dbPath ? `${p.dbPath}/extraction-jobs.db` : undefined;
        return new NeDBExtractionJobRepository(filename);
      },
    })
    .build();

  const { createEventPublisherRegistry } = await import(
    "../../../../platform/composition/createEventPublisherRegistry.js"
  );
  const eventPublisherRegistry = createEventPublisherRegistry();

  const { ExtractionComposer } = await import("./ExtractionComposer.js");
  const infra = await ExtractionComposer.resolve(policy, {
    repository: repositoryRegistry,
    eventPublisher: eventPublisherRegistry,
  });

  const { ExtractionUseCases } = await import("../application/index.js");
  const useCases = new ExtractionUseCases(
    infra.repository,
    infra.extractors,
    infra.eventPublisher,
  );

  return { useCases, infra };
}
