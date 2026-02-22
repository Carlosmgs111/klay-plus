/**
 * Semantic Unit Module Factory
 *
 * Entry point for creating the Semantic Unit module.
 * Builds provider registries and delegates to Composer for wiring.
 *
 * @example
 * ```typescript
 * const { useCases, infra } = await semanticUnitFactory({ provider: "server", dbPath: "./data" });
 * await useCases.createSemanticUnit.execute({ ... });
 * ```
 */

import type {
  SemanticUnitInfrastructurePolicy,
  ResolvedSemanticUnitInfra,
} from "./infra-policies.js";
import type { SemanticUnitUseCases } from "../application/index.js";
import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";

// ─── Factory Result Contract ─────────────────────────────────────────────────

export interface SemanticUnitFactoryResult {
  /** Assembled use cases ready for consumption */
  useCases: SemanticUnitUseCases;
  /**
   * Resolved infrastructure.
   * Exposed for facade coordination (e.g., repository access).
   * Should NOT be used directly by external consumers.
   */
  infra: ResolvedSemanticUnitInfra;
}

// ─── Factory Function ────────────────────────────────────────────────────────

export async function semanticUnitFactory(
  policy: SemanticUnitInfrastructurePolicy,
): Promise<SemanticUnitFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder"
  );

  // ─── Repository Registry ─────────────────────────────────────────────────
  const repositoryRegistry = new ProviderRegistryBuilder<SemanticUnitRepository>()
    .add("in-memory", {
      create: async () => {
        const { InMemorySemanticUnitRepository } = await import(
          "../infrastructure/persistence/InMemorySemanticUnitRepository.js"
        );
        return new InMemorySemanticUnitRepository();
      },
    })
    .add("browser", {
      create: async (p) => {
        const { IndexedDBSemanticUnitRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBSemanticUnitRepository.js"
        );
        return new IndexedDBSemanticUnitRepository(
          (p.dbName as string) ?? "knowledge-platform",
        );
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBSemanticUnitRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBSemanticUnitRepository.js"
        );
        const filename = p.dbPath ? `${p.dbPath}/semantic-units.db` : undefined;
        return new NeDBSemanticUnitRepository(filename);
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
  const { SemanticUnitComposer } = await import("./SemanticUnitComposer.js");
  const infra = await SemanticUnitComposer.resolve(policy, {
    repository: repositoryRegistry,
    eventPublisher: eventPublisherRegistry,
  });

  const { SemanticUnitUseCases } = await import("../application/index.js");
  const useCases = new SemanticUnitUseCases(infra.repository, infra.eventPublisher);

  return { useCases, infra };
}
