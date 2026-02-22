import type {
  ResourceInfrastructurePolicy,
  ResolvedResourceInfra,
} from "./infra-policies.js";
import type { ResourceRepository } from "../domain/ResourceRepository.js";
import type { ResourceStorage } from "../domain/ResourceStorage.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";
import type { ProviderRegistry } from "../../../../shared/domain/ProviderRegistry";

/**
 * Composer for the Resource Module.
 *
 * Resolves infrastructure dependencies via provider registries.
 * The registries are built externally (in the factory) and injected here.
 */
export class ResourceComposer {
  static async resolve(
    policy: ResourceInfrastructurePolicy,
    registries: {
      repository: ProviderRegistry<ResourceRepository>;
      storage: ProviderRegistry<ResourceStorage>;
      eventPublisher: ProviderRegistry<EventPublisher>;
    },
  ): Promise<ResolvedResourceInfra> {
    const [repository, storage, eventPublisher] = await Promise.all([
      registries.repository.resolve(policy.provider).create(policy),
      registries.storage.resolve(policy.provider).create(policy),
      registries.eventPublisher.resolve(policy.provider).create(policy),
    ]);

    // Determine the storage provider name for the aggregate
    const storageProvider = policy.provider === "in-memory" ? "in-memory" : "local";

    return { repository, storage, storageProvider, eventPublisher };
  }
}
