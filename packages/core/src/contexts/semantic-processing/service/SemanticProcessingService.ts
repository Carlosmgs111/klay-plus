import type { ProjectionUseCases } from "../projection/application";
import type { ProcessingProfileRepository } from "../processing-profile/domain/ProcessingProfileRepository";
import type { EventPublisher } from "../../../shared/domain/EventPublisher";
import type { ProjectionType } from "../projection/domain/ProjectionType";
import type { ResolvedSemanticProcessingModules, VectorStoreConfig } from "../composition/factory";
import { ProcessingProfile } from "../processing-profile/domain/ProcessingProfile";
import { ProcessingProfileId } from "../processing-profile/domain/ProcessingProfileId";
import { ProfileStatus } from "../processing-profile/domain/ProfileStatus";
import { PreparationLayer, FragmentationLayer, ProjectionLayer } from "../processing-profile/domain/value-objects";
import {
  ProfileAlreadyExistsError,
  ProfileNameRequiredError,
  PreparationStrategyRequiredError,
  FragmentationStrategyRequiredError,
  ProjectionStrategyRequiredError,
  ProfileNotFoundError,
  ProfileDeprecatedError,
  ProfileAlreadyDeprecatedError,
} from "../processing-profile/domain/errors";
import { Result } from "../../../shared/domain/Result";
import type { DomainError } from "../../../shared/domain/errors";

export interface ProcessContentSuccess {
  projectionId: string;
  chunksCount: number;
  dimensions: number;
  model: string;
}

export interface CreateProfileSuccess {
  profileId: string;
  version: number;
}

export interface UpdateProfileSuccess {
  profileId: string;
  version: number;
}

export interface DeprecateProfileSuccess {
  profileId: string;
}

export class SemanticProcessingService {
  private readonly _projection: ProjectionUseCases;
  private readonly _profileRepository: ProcessingProfileRepository;
  private readonly _profileEventPublisher: EventPublisher;
  private readonly _vectorStoreConfig: VectorStoreConfig;

  constructor(modules: ResolvedSemanticProcessingModules) {
    this._projection = modules.projection;
    this._profileRepository = modules.profileRepository;
    this._profileEventPublisher = modules.profileEventPublisher;
    this._vectorStoreConfig = modules.vectorStoreConfig;
  }

  get projection(): ProjectionUseCases {
    return this._projection;
  }

  get vectorStoreConfig(): VectorStoreConfig {
    return this._vectorStoreConfig;
  }

  // ── Processing Profile operations ────────────────────────────────────

  async listProcessingProfiles(): Promise<ProcessingProfile[]> {
    const profiles = await this._profileRepository.findAll();
    return profiles.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === ProfileStatus.Active ? -1 : 1;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  async createProcessingProfile(params: {
    id: string;
    name: string;
    preparation: { strategyId: string; config: Record<string, unknown> };
    fragmentation: { strategyId: string; config: Record<string, unknown> };
    projection: { strategyId: string; config: Record<string, unknown> };
  }): Promise<Result<DomainError, CreateProfileSuccess>> {
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
    const existing = await this._profileRepository.findById(profileId);
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

    await this._profileRepository.save(profile);
    await this._profileEventPublisher.publishAll(profile.clearEvents());

    return Result.ok({
      profileId: profile.id.value,
      version: profile.version,
    });
  }

  async updateProcessingProfile(params: {
    id: string;
    name?: string;
    preparation?: { strategyId: string; config: Record<string, unknown> };
    fragmentation?: { strategyId: string; config: Record<string, unknown> };
    projection?: { strategyId: string; config: Record<string, unknown> };
  }): Promise<Result<DomainError, UpdateProfileSuccess>> {
    const profileId = ProcessingProfileId.create(params.id);
    const profile = await this._profileRepository.findById(profileId);

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

    await this._profileRepository.save(profile);
    await this._profileEventPublisher.publishAll(profile.clearEvents());

    return Result.ok({
      profileId: profile.id.value,
      version: profile.version,
    });
  }

  async deprecateProcessingProfile(params: {
    id: string;
    reason: string;
  }): Promise<Result<DomainError, DeprecateProfileSuccess>> {
    const profileId = ProcessingProfileId.create(params.id);
    const profile = await this._profileRepository.findById(profileId);

    if (!profile) {
      return Result.fail(new ProfileNotFoundError(params.id));
    }

    if (profile.isDeprecated) {
      return Result.fail(new ProfileAlreadyDeprecatedError(params.id));
    }

    profile.deprecate(params.reason);

    await this._profileRepository.save(profile);
    await this._profileEventPublisher.publishAll(profile.clearEvents());

    return Result.ok({ profileId: profile.id.value });
  }

  // ── Content processing ───────────────────────────────────────────────

  async processContent(params: {
    projectionId: string;
    sourceId: string;
    content: string;
    type: ProjectionType;
    processingProfileId: string;
  }): Promise<Result<DomainError, ProcessContentSuccess>> {
    const result = await this._projection.generateProjection.execute({
      projectionId: params.projectionId,
      sourceId: params.sourceId,
      content: params.content,
      type: params.type,
      processingProfileId: params.processingProfileId,
    });

    if (result.isFail()) {
      return Result.fail(result.error);
    }

    return Result.ok({
      projectionId: result.value.projectionId,
      chunksCount: result.value.chunksCount,
      dimensions: result.value.dimensions,
      model: result.value.model,
    });
  }

  async batchProcess(
    items: Array<{
      projectionId: string;
      sourceId: string;
      content: string;
      type: ProjectionType;
      processingProfileId: string;
    }>,
  ): Promise<
    Array<{
      projectionId: string;
      success: boolean;
      chunksCount?: number;
      error?: string;
    }>
  > {
    const results = await Promise.allSettled(
      items.map((item) => this.processContent(item)),
    );

    return results.map((promiseResult, index) => {
      if (promiseResult.status === "fulfilled") {
        const result = promiseResult.value;
        if (result.isOk()) {
          return {
            projectionId: result.value.projectionId,
            success: true,
            chunksCount: result.value.chunksCount,
          };
        }
        return {
          projectionId: items[index].projectionId,
          success: false,
          error: result.error.message,
        };
      }
      return {
        projectionId: items[index].projectionId,
        success: false,
        error:
          promiseResult.reason instanceof Error
            ? promiseResult.reason.message
            : String(promiseResult.reason),
      };
    });
  }
}
