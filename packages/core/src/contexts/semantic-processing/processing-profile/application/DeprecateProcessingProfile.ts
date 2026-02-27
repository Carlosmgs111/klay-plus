import type { EventPublisher } from "../../../../shared/domain/index.js";
import { Result } from "../../../../shared/domain/Result.js";
import { ProcessingProfileId } from "../domain/ProcessingProfileId.js";
import type { ProcessingProfile } from "../domain/ProcessingProfile.js";
import type { ProcessingProfileRepository } from "../domain/ProcessingProfileRepository.js";
import {
  ProfileNotFoundError,
  ProfileAlreadyDeprecatedError,
  type ProfileError,
} from "../domain/errors/index.js";

export interface DeprecateProcessingProfileCommand {
  id: string;
  reason: string;
}

export class DeprecateProcessingProfile {
  constructor(
    private readonly repository: ProcessingProfileRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(
    command: DeprecateProcessingProfileCommand,
  ): Promise<Result<ProfileError, ProcessingProfile>> {
    const profileId = ProcessingProfileId.create(command.id);
    const profile = await this.repository.findById(profileId);

    if (!profile) {
      return Result.fail(new ProfileNotFoundError(command.id));
    }

    if (profile.isDeprecated) {
      return Result.fail(new ProfileAlreadyDeprecatedError(command.id));
    }

    profile.deprecate(command.reason);

    await this.repository.save(profile);
    await this.eventPublisher.publishAll(profile.clearEvents());

    return Result.ok(profile);
  }
}
