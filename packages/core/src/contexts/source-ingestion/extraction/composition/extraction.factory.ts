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
import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";

// ─── Factory Result Contract ─────────────────────────────────────────────────

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

// ─── Factory Function ────────────────────────────────────────────────────────

export async function extractionFactory(
  policy: ExtractionInfrastructurePolicy,
): Promise<ExtractionFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder.js"
  );

  // ─── Repository Registry ─────────────────────────────────────────────────
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

  // ─── EventPublisher Registry ─────────────────────────────────────────────
  const eventPublisherRegistry = new ProviderRegistryBuilder<EventPublisher>()
    .add("in-memory", {
      create: async () => {
        const { InMemoryEventPublisher } = await import(
          "../../../../platform/eventing/InMemoryEventPublisher.js"
        );
        return new InMemoryEventPublisher();
      },
    })
    .add("browser", {
      create: async () => {
        const { InMemoryEventPublisher } = await import(
          "../../../../platform/eventing/InMemoryEventPublisher.js"
        );
        return new InMemoryEventPublisher();
      },
    })
    .add("server", {
      create: async () => {
        const { InMemoryEventPublisher } = await import(
          "../../../../platform/eventing/InMemoryEventPublisher.js"
        );
        return new InMemoryEventPublisher();
      },
    })
    .build();

  // ─── Compose ─────────────────────────────────────────────────────────────
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
