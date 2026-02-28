import type { ProjectionUseCases } from "../projection/application";
import type { ProcessingProfileRepository } from "../processing-profile/domain/ProcessingProfileRepository";
import type { EventPublisher } from "../../../shared/domain/EventPublisher";
import type { ProjectionType } from "../projection/domain/ProjectionType";
import type { ResolvedSemanticProcessingModules, VectorStoreConfig } from "../composition/factory";
import { ProcessingProfile } from "../processing-profile/domain/ProcessingProfile";
import { ProcessingProfileId } from "../processing-profile/domain/ProcessingProfileId";
import {
  ProfileAlreadyExistsError,
  ProfileNameRequiredError,
  ProfileChunkingStrategyRequiredError,
  ProfileEmbeddingStrategyRequiredError,
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

  async createProcessingProfile(params: {
    id: string;
    name: string;
    chunkingStrategyId: string;
    embeddingStrategyId: string;
    configuration?: Record<string, unknown>;
  }): Promise<Result<DomainError, CreateProfileSuccess>> {
    if (!params.name || params.name.trim() === "") {
      return Result.fail(new ProfileNameRequiredError());
    }
    if (!params.chunkingStrategyId || params.chunkingStrategyId.trim() === "") {
      return Result.fail(new ProfileChunkingStrategyRequiredError());
    }
    if (!params.embeddingStrategyId || params.embeddingStrategyId.trim() === "") {
      return Result.fail(new ProfileEmbeddingStrategyRequiredError());
    }

    const profileId = ProcessingProfileId.create(params.id);
    const existing = await this._profileRepository.findById(profileId);
    if (existing) {
      return Result.fail(new ProfileAlreadyExistsError(params.id));
    }

    const profile = ProcessingProfile.create({
      id: profileId,
      name: params.name,
      chunkingStrategyId: params.chunkingStrategyId,
      embeddingStrategyId: params.embeddingStrategyId,
      configuration: params.configuration,
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
    chunkingStrategyId?: string;
    embeddingStrategyId?: string;
    configuration?: Record<string, unknown>;
  }): Promise<Result<DomainError, UpdateProfileSuccess>> {
    const profileId = ProcessingProfileId.create(params.id);
    const profile = await this._profileRepository.findById(profileId);

    if (!profile) {
      return Result.fail(new ProfileNotFoundError(params.id));
    }

    if (profile.isDeprecated) {
      return Result.fail(new ProfileDeprecatedError(params.id));
    }

    profile.update({
      name: params.name,
      chunkingStrategyId: params.chunkingStrategyId,
      embeddingStrategyId: params.embeddingStrategyId,
      configuration: params.configuration,
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
    semanticUnitId: string;
    semanticUnitVersion: number;
    content: string;
    type: ProjectionType;
    processingProfileId: string;
  }): Promise<Result<DomainError, ProcessContentSuccess>> {
    const result = await this._projection.generateProjection.execute({
      projectionId: params.projectionId,
      semanticUnitId: params.semanticUnitId,
      semanticUnitVersion: params.semanticUnitVersion,
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
      semanticUnitId: string;
      semanticUnitVersion: number;
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
