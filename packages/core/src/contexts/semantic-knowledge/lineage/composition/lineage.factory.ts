/**
 * Lineage Module Factory
 *
 * Entry point for creating the Lineage module.
 * Builds provider registries and delegates to Composer for wiring.
 *
 * @example
 * ```typescript
 * const { useCases, infra } = await lineageFactory({ provider: "server", dbPath: "./data" });
 * await useCases.registerTransformation.execute({ ... });
 * ```
 */

import type {
  LineageInfrastructurePolicy,
  ResolvedLineageInfra,
} from "./infra-policies.js";
import type { LineageUseCases } from "../application/index.js";
import type { KnowledgeLineageRepository } from "../domain/KnowledgeLineageRepository.js";
export interface LineageFactoryResult {
  /** Assembled use cases ready for consumption */
  useCases: LineageUseCases;
  /**
   * Resolved infrastructure.
   * Exposed for facade coordination (e.g., repository access).
   * Should NOT be used directly by external consumers.
   */
  infra: ResolvedLineageInfra;
}

export async function lineageFactory(
  policy: LineageInfrastructurePolicy,
): Promise<LineageFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder.js"
  );

  const repositoryRegistry = new ProviderRegistryBuilder<KnowledgeLineageRepository>()
    .add("in-memory", {
      create: async () => {
        const { InMemoryKnowledgeLineageRepository } = await import(
          "../infrastructure/persistence/InMemoryKnowledgeLineageRepository.js"
        );
        return new InMemoryKnowledgeLineageRepository();
      },
    })
    .add("browser", {
      create: async (p) => {
        const { IndexedDBKnowledgeLineageRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBKnowledgeLineageRepository.js"
        );
        return new IndexedDBKnowledgeLineageRepository(
          (p.dbName as string) ?? "knowledge-platform",
        );
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBKnowledgeLineageRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBKnowledgeLineageRepository.js"
        );
        const filename = p.dbPath
          ? `${p.dbPath}/knowledge-lineage.db`
          : undefined;
        return new NeDBKnowledgeLineageRepository(filename);
      },
    })
    .build();

  const { createEventPublisherRegistry } = await import(
    "../../../../platform/composition/createEventPublisherRegistry.js"
  );
  const eventPublisherRegistry = createEventPublisherRegistry();

  const { LineageComposer } = await import("./LineageComposer.js");
  const infra = await LineageComposer.resolve(policy, {
    repository: repositoryRegistry,
    eventPublisher: eventPublisherRegistry,
  });

  const { LineageUseCases } = await import("../application/index.js");
  const useCases = new LineageUseCases(infra.repository, infra.eventPublisher);

  return { useCases, infra };
}
