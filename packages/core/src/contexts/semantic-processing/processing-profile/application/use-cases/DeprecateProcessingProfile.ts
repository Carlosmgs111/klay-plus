import type { ProcessingProfileRepository } from "../../domain/ProcessingProfileRepository";
import type { EventPublisher } from "../../../../../shared/domain/EventPublisher";
import type { DomainError } from "../../../../../shared/domain/errors";
import { ProcessingProfileId } from "../../domain/ProcessingProfileId";
import {
  ProfileNotFoundError,
  ProfileAlreadyDeprecatedError,
} from "../../domain/errors";
import { Result } from "../../../../../shared/domain/Result";

export interface DeprecateProcessingProfileInput {
  id: string;
  reason: string;
}

export interface DeprecateProcessingProfileSuccess {
  profileId: string;
}

/** Boundary alias for web consumers */
export type DeprecateProfileInput = DeprecateProcessingProfileInput;
/** Boundary alias for web consumers */
export type DeprecateProfileResult = DeprecateProcessingProfileSuccess;

export class DeprecateProcessingProfile {
  constructor(
    private readonly _repository: ProcessingProfileRepository,
    private readonly _eventPublisher: EventPublisher,
  ) {}

  async execute(
    params: DeprecateProcessingProfileInput,
  ): Promise<Result<DomainError, DeprecateProcessingProfileSuccess>> {
    const profileId = ProcessingProfileId.create(params.id);
    const profile = await this._repository.findById(profileId);

    if (!profile) {
      return Result.fail(new ProfileNotFoundError(params.id));
    }

    if (profile.isDeprecated) {
      return Result.fail(new ProfileAlreadyDeprecatedError(params.id));
    }

    profile.deprecate(params.reason);

    await this._repository.save(profile);
    await this._eventPublisher.publishAll(profile.clearEvents());

    return Result.ok({ profileId: profile.id.value });
  }
}
