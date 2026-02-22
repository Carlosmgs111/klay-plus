/**
 * Source Module Factory
 *
 * Entry point for creating the Source module.
 * Builds provider registries and delegates to Composer for wiring.
 *
 * @example
 * ```typescript
 * const { useCases, infra } = await sourceFactory({ provider: "server", dbPath: "./data" });
 * await useCases.registerSource.execute({ ... });
 * ```
 */

import type { SourceInfrastructurePolicy, ResolvedSourceInfra } from "./infra-policies.js";
import type { SourceUseCases } from "../application/index.js";
import type { SourceRepository } from "../domain/SourceRepository.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";

// ─── Factory Result Contract ─────────────────────────────────────────────────

export interface SourceFactoryResult {
  /** Assembled use cases ready for consumption */
  useCases: SourceUseCases;
  /**
   * Resolved infrastructure.
   * Exposed for facade coordination (e.g., repository access).
   * Should NOT be used directly by external consumers.
   */
  infra: ResolvedSourceInfra;
}

// ─── Factory Function ────────────────────────────────────────────────────────

export async function sourceFactory(
  policy: SourceInfrastructurePolicy,
): Promise<SourceFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder"
  );

  // ─── Repository Registry ─────────────────────────────────────────────────
  const repositoryRegistry = new ProviderRegistryBuilder<SourceRepository>()
    .add("in-memory", {
      create: async () => {
        const { InMemorySourceRepository } = await import(
          "../infrastructure/persistence/InMemorySourceRepository.js"
        );
        return new InMemorySourceRepository();
      },
    })
    .add("browser", {
      create: async (p) => {
        const { IndexedDBSourceRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBSourceRepository.js"
        );
        return new IndexedDBSourceRepository(
          (p.dbName as string) ?? "knowledge-platform",
        );
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBSourceRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBSourceRepository.js"
        );
        const filename = p.dbPath ? `${p.dbPath}/sources.db` : undefined;
        return new NeDBSourceRepository(filename);
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
  const { SourceComposer } = await import("./SourceComposer.js");
  const infra = await SourceComposer.resolve(policy, {
    repository: repositoryRegistry,
    eventPublisher: eventPublisherRegistry,
  });

  const { SourceUseCases } = await import("../application/index.js");
  const useCases = new SourceUseCases(infra.repository, infra.eventPublisher);

  return { useCases, infra };
}
