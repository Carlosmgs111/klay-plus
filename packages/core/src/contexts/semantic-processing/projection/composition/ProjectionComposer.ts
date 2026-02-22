import type {
  ProjectionInfrastructurePolicy,
  ResolvedProjectionInfra,
} from "./infra-policies.js";
import type { SemanticProjectionRepository } from "../domain/SemanticProjectionRepository.js";
import type { VectorWriteStore } from "../domain/ports/VectorWriteStore.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";
import type { ProcessingProfileRepository } from "../../processing-profile/domain/ProcessingProfileRepository.js";
import type { ProviderRegistry } from "../../../../shared/domain/ProviderRegistry";

/**
 * Composer for the Projection Module.
 *
 * Resolves infrastructure dependencies via provider registries.
 * The registries are built externally (in the factory) and injected here.
 *
 * Strategy resolution (embedding/chunking) is NO LONGER done at composition time —
 * it's delegated to ProcessingProfileMaterializer at runtime,
 * driven by the ProcessingProfile domain aggregate.
 */
export class ProjectionComposer {
  /**
   * Resolves projection infrastructure.
   *
   * Requires an externally-provided ProcessingProfileRepository
   * (from the processing-profile module factory) for cross-module wiring.
   *
   * Creates the ProcessingProfileMaterializer internally from the policy.
   */
  static async resolve(
    policy: ProjectionInfrastructurePolicy,
    profileRepository: ProcessingProfileRepository,
    registries: {
      repository: ProviderRegistry<SemanticProjectionRepository>;
      vectorWriteStore: ProviderRegistry<VectorWriteStore>;
      eventPublisher: ProviderRegistry<EventPublisher>;
    },
  ): Promise<ResolvedProjectionInfra> {
    const { ProcessingProfileMaterializer } = await import(
      "./ProcessingProfileMaterializer.js"
    );

    const [repository, vectorWriteStore, eventPublisher] = await Promise.all([
      registries.repository.resolve(policy.provider).create(policy),
      registries.vectorWriteStore.resolve(policy.provider).create(policy),
      registries.eventPublisher.resolve(policy.provider).create(policy),
    ]);

    const materializer = new ProcessingProfileMaterializer(policy);

    return {
      repository,
      profileRepository,
      materializer,
      vectorWriteStore,
      eventPublisher,
    };
  }
}
