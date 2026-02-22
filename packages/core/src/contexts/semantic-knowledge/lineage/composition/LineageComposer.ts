import type {
  LineageInfrastructurePolicy,
  ResolvedLineageInfra,
} from "./infra-policies.js";
import type { KnowledgeLineageRepository } from "../domain/KnowledgeLineageRepository.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";
import type { ProviderRegistry } from "../../../../shared/domain/ProviderRegistry.js";

/**
 * Composer for the Lineage Module.
 *
 * Resolves infrastructure dependencies via provider registries.
 * The registries are built externally (in the factory) and injected here.
 */
export class LineageComposer {
  static async resolve(
    policy: LineageInfrastructurePolicy,
    registries: {
      repository: ProviderRegistry<KnowledgeLineageRepository>;
      eventPublisher: ProviderRegistry<EventPublisher>;
    },
  ): Promise<ResolvedLineageInfra> {
    const [repository, eventPublisher] = await Promise.all([
      registries.repository.resolve(policy.provider).create(policy),
      registries.eventPublisher.resolve(policy.provider).create(policy),
    ]);

    return { repository, eventPublisher };
  }
}
