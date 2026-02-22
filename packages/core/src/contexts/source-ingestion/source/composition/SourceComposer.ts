import type {
  SourceInfrastructurePolicy,
  ResolvedSourceInfra,
} from "./infra-policies.js";
import type { SourceRepository } from "../domain/SourceRepository.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";
import type { ProviderRegistry } from "../../../../shared/domain/ProviderRegistry";

/**
 * Composer for the Source Module.
 *
 * Resolves infrastructure dependencies via provider registries.
 * The registries are built externally (in the factory) and injected here.
 */
export class SourceComposer {
  static async resolve(
    policy: SourceInfrastructurePolicy,
    registries: {
      repository: ProviderRegistry<SourceRepository>;
      eventPublisher: ProviderRegistry<EventPublisher>;
    },
  ): Promise<ResolvedSourceInfra> {
    const [repository, eventPublisher] = await Promise.all([
      registries.repository.resolve(policy.provider).create(policy),
      registries.eventPublisher.resolve(policy.provider).create(policy),
    ]);

    return { repository, eventPublisher };
  }
}
