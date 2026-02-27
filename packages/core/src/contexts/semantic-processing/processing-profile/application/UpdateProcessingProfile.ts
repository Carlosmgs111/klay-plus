import type { EventPublisher } from "../../../../shared/domain/index.js";
import { Result } from "../../../../shared/domain/Result.js";
import { ProcessingProfileId } from "../domain/ProcessingProfileId.js";
import type { ProcessingProfile } from "../domain/ProcessingProfile.js";
import type { ProcessingProfileRepository } from "../domain/ProcessingProfileRepository.js";
import {
  ProfileNotFoundError,
  ProfileDeprecatedError,
  type ProfileError,
} from "../domain/errors/index.js";

export interface UpdateProcessingProfileCommand {
  id: string;
  name?: string;
  chunkingStrategyId?: string;
  embeddingStrategyId?: string;
  configuration?: Record<string, unknown>;
}

export class UpdateProcessingProfile {
  constructor(
    private readonly repository: ProcessingProfileRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(
    command: UpdateProcessingProfileCommand,
  ): Promise<Result<ProfileError, ProcessingProfile>> {
    const profileId = ProcessingProfileId.create(command.id);
    const profile = await this.repository.findById(profileId);

    if (!profile) {
      return Result.fail(new ProfileNotFoundError(command.id));
    }

    if (profile.isDeprecated) {
      return Result.fail(new ProfileDeprecatedError(command.id));
    }

    profile.update({
      name: command.name,
      chunkingStrategyId: command.chunkingStrategyId,
      embeddingStrategyId: command.embeddingStrategyId,
      configuration: command.configuration,
    });

    await this.repository.save(profile);
    await this.eventPublisher.publishAll(profile.clearEvents());

    return Result.ok(profile);
  }
}
