import type {
  ProcessingProfileInfrastructurePolicy,
  ResolvedProcessingProfileInfra,
} from "./infra-policies.js";
import type { ProcessingProfileRepository } from "../domain/ProcessingProfileRepository.js";
import type { ProviderRegistry } from "../../../../shared/domain/ProviderRegistry";

/**
 * Composer for the Processing Profile Module.
 *
 * Resolves infrastructure dependencies via provider registries.
 * The registries are built externally (in the factory) and injected here.
 */
export class ProcessingProfileComposer {
  static async resolve(
    policy: ProcessingProfileInfrastructurePolicy,
    registries: {
      repository: ProviderRegistry<ProcessingProfileRepository>;
    },
  ): Promise<ResolvedProcessingProfileInfra> {
    const repository = await registries.repository
      .resolve(policy.provider)
      .create(policy);

    return { repository };
  }
}
