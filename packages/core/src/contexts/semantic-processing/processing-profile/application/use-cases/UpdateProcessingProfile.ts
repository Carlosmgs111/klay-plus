import type { ProcessingProfileRepository } from "../../domain/ProcessingProfileRepository";
import type { EventPublisher } from "../../../../../shared/domain/EventPublisher";
import type { DomainError } from "../../../../../shared/domain/errors";
import { ProcessingProfileId } from "../../domain/ProcessingProfileId";
import { PreparationLayer, FragmentationLayer, ProjectionLayer } from "../../domain/value-objects";
import {
  ProfileNotFoundError,
  ProfileDeprecatedError,
} from "../../domain/errors";
import { Result } from "../../../../../shared/domain/Result";

export interface UpdateProcessingProfileInput {
  id: string;
  name?: string;
  preparation?: { strategyId: string; config: Record<string, unknown> };
  fragmentation?: { strategyId: string; config: Record<string, unknown> };
  projection?: { strategyId: string; config: Record<string, unknown> };
}

export interface UpdateProcessingProfileSuccess {
  profileId: string;
  version: number;
}

export class UpdateProcessingProfile {
  constructor(
    private readonly _repository: ProcessingProfileRepository,
    private readonly _eventPublisher: EventPublisher,
  ) {}

  async execute(
    params: UpdateProcessingProfileInput,
  ): Promise<Result<DomainError, UpdateProcessingProfileSuccess>> {
    const profileId = ProcessingProfileId.create(params.id);
    const profile = await this._repository.findById(profileId);

    if (!profile) {
      return Result.fail(new ProfileNotFoundError(params.id));
    }

    if (profile.isDeprecated) {
      return Result.fail(new ProfileDeprecatedError(params.id));
    }

    const preparation = params.preparation
      ? PreparationLayer.create(params.preparation.strategyId, params.preparation.config)
      : undefined;
    const fragmentation = params.fragmentation
      ? FragmentationLayer.create(params.fragmentation.strategyId, params.fragmentation.config)
      : undefined;
    const projection = params.projection
      ? ProjectionLayer.create(params.projection.strategyId, params.projection.config)
      : undefined;

    profile.update({
      name: params.name,
      preparation,
      fragmentation,
      projection,
    });

    await this._repository.save(profile);
    await this._eventPublisher.publishAll(profile.clearEvents());

    return Result.ok({
      profileId: profile.id.value,
      version: profile.version,
    });
  }
}
