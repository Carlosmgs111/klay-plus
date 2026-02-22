import type { ManifestRepository } from "../../contracts/ManifestRepository.js";
import type { GetManifestInput, GetManifestSuccess } from "../../contracts/dtos.js";
import { Result } from "../../../../shared/domain/Result";
import { KnowledgePipelineError } from "../../domain/KnowledgePipelineError.js";
import { PipelineStep } from "../../domain/PipelineStep.js";

/**
 * Retrieves content manifests by resource ID, source ID, or manifest ID.
 * Provides a top-down view: "given a resource, what was produced?"
 */
export class GetManifest {
  constructor(private readonly repository: ManifestRepository) {}

  async execute(
    input: GetManifestInput,
  ): Promise<Result<KnowledgePipelineError, GetManifestSuccess>> {
    try {
      // Query by manifest ID (most specific)
      if (input.manifestId) {
        const manifest = await this.repository.findById(input.manifestId);
        return Result.ok({
          manifests: manifest ? [manifest] : [],
        });
      }

      // Query by resource ID
      if (input.resourceId) {
        const manifests = await this.repository.findByResourceId(input.resourceId);
        return Result.ok({ manifests });
      }

      // Query by source ID
      if (input.sourceId) {
        const manifests = await this.repository.findBySourceId(input.sourceId);
        return Result.ok({ manifests });
      }

      // No filter — return all
      const manifests = await this.repository.findAll();
      return Result.ok({ manifests });
    } catch (error) {
      return Result.fail(
        KnowledgePipelineError.fromStep(
          PipelineStep.Search,
          error,
          [],
        ),
      );
    }
  }
}
