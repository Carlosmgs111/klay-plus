import type { ProcessingProfileRepository } from "../../domain/ProcessingProfileRepository";
import type { EventPublisher } from "../../../../../shared/domain/EventPublisher";
import type { DomainError } from "../../../../../shared/domain/errors";
import { ProcessingProfile } from "../../domain/ProcessingProfile";
import { ProcessingProfileId } from "../../domain/ProcessingProfileId";
import { PreparationLayer, FragmentationLayer, ProjectionLayer } from "../../domain/value-objects";
import {
  ProfileAlreadyExistsError,
  ProfileNameRequiredError,
  PreparationStrategyRequiredError,
  FragmentationStrategyRequiredError,
  ProjectionStrategyRequiredError,
} from "../../domain/errors";
import { Result } from "../../../../../shared/domain/Result";

export interface CreateProcessingProfileInput {
  id: string;
  name: string;
  preparation: { strategyId: string; config: Record<string, unknown> };
  fragmentation: { strategyId: string; config: Record<string, unknown> };
  projection: { strategyId: string; config: Record<string, unknown> };
}

export interface CreateProcessingProfileSuccess {
  profileId: string;
  version: number;
}

export class CreateProcessingProfile {
  constructor(
    private readonly _repository: ProcessingProfileRepository,
    private readonly _eventPublisher: EventPublisher,
  ) {}

  async execute(
    params: CreateProcessingProfileInput,
  ): Promise<Result<DomainError, CreateProcessingProfileSuccess>> {
    if (!params.name || params.name.trim() === "") {
      return Result.fail(new ProfileNameRequiredError());
    }
    if (!params.preparation?.strategyId) {
      return Result.fail(new PreparationStrategyRequiredError());
    }
    if (!params.fragmentation?.strategyId) {
      return Result.fail(new FragmentationStrategyRequiredError());
    }
    if (!params.projection?.strategyId) {
      return Result.fail(new ProjectionStrategyRequiredError());
    }

    const profileId = ProcessingProfileId.create(params.id);
    const existing = await this._repository.findById(profileId);
    if (existing) {
      return Result.fail(new ProfileAlreadyExistsError(params.id));
    }

    const preparation = PreparationLayer.create(params.preparation.strategyId, params.preparation.config);
    const fragmentation = FragmentationLayer.create(params.fragmentation.strategyId, params.fragmentation.config);
    const projection = ProjectionLayer.create(params.projection.strategyId, params.projection.config);

    const profile = ProcessingProfile.create({
      id: profileId,
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
