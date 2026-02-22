import type {
  SemanticUnitInfrastructurePolicy,
  ResolvedSemanticUnitInfra,
} from "./infra-policies.js";
import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";
import type { ProviderRegistry } from "../../../../shared/domain/ProviderRegistry.js";

/**
 * Composer for the Semantic Unit Module.
 *
 * Resolves infrastructure dependencies via provider registries.
 * The registries are built externally (in the factory) and injected here.
 */
export class SemanticUnitComposer {
  static async resolve(
    policy: SemanticUnitInfrastructurePolicy,
    registries: {
      repository: ProviderRegistry<SemanticUnitRepository>;
      eventPublisher: ProviderRegistry<EventPublisher>;
    },
  ): Promise<ResolvedSemanticUnitInfra> {
    const [repository, eventPublisher] = await Promise.all([
      registries.repository.resolve(policy.provider).create(policy),
      registries.eventPublisher.resolve(policy.provider).create(policy),
    ]);

    return { repository, eventPublisher };
  }
}
