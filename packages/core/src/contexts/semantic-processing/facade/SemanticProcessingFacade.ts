import type { ProjectionUseCases } from "../projection/application/index.js";
import type { ProcessingProfileUseCases } from "../processing-profile/application/index.js";
import type { ProjectionType } from "../projection/domain/ProjectionType.js";
import type { ResolvedSemanticProcessingModules, VectorStoreConfig } from "./composition/infra-policies.js";
import { Result } from "../../../shared/domain/Result.js";
import type { DomainError } from "../../../shared/domain/errors/index.js";

// ─── Facade Result Types ────────────────────────────────────────────────────

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

// ─── Facade ─────────────────────────────────────────────────────────────────

/**
 * Application Facade for the Semantic Processing bounded context.
 *
 * Provides a unified entry point to all modules within the context,
 * coordinating use cases for content projection and processing profile management.
 *
 * This is an Application Layer component - it does NOT contain domain logic.
 * It only coordinates existing use cases and handles cross-module workflows.
 *
 * This is a CONTEXT-LEVEL facade. Individual modules do NOT have facades.
 */
export class SemanticProcessingFacade {
  private readonly _projection: ProjectionUseCases;
  private readonly _processingProfile: ProcessingProfileUseCases;
  private readonly _vectorStoreConfig: VectorStoreConfig;

  constructor(modules: ResolvedSemanticProcessingModules) {
    this._projection = modules.projection;
    this._processingProfile = modules.processingProfile;
    this._vectorStoreConfig = modules.vectorStoreConfig;
  }

  // ─── Module Accessors ─────────────────────────────────────────────────────

  get projection(): ProjectionUseCases {
    return this._projection;
  }

  get processingProfile(): ProcessingProfileUseCases {
    return this._processingProfile;
  }

  /**
   * Exposes the vector store configuration for cross-context wiring.
   * The knowledge-retrieval context uses this config to create its own
   * VectorReadStore pointing to the same physical resource.
   */
  get vectorStoreConfig(): VectorStoreConfig {
    return this._vectorStoreConfig;
  }

  // ─── Profile Management Operations ────────────────────────────────────────

  /**
   * Creates a new processing profile.
   */
  async createProcessingProfile(params: {
    id: string;
    name: string;
    chunkingStrategyId: string;
    embeddingStrategyId: string;
    configuration?: Record<string, unknown>;
  }): Promise<Result<DomainError, CreateProfileSuccess>> {
    const result = await this._processingProfile.createProfile.execute({
      id: params.id,
      name: params.name,
      chunkingStrategyId: params.chunkingStrategyId,
      embeddingStrategyId: params.embeddingStrategyId,
      configuration: params.configuration,
    });

    if (result.isFail()) {
      return Result.fail(result.error);
    }

    return Result.ok({
      profileId: result.value.id.value,
      version: result.value.version,
    });
  }

  /**
   * Updates an existing processing profile.
   */
  async updateProcessingProfile(params: {
    id: string;
    name?: string;
    chunkingStrategyId?: string;
    embeddingStrategyId?: string;
    configuration?: Record<string, unknown>;
  }): Promise<Result<DomainError, UpdateProfileSuccess>> {
    const result = await this._processingProfile.updateProfile.execute({
      id: params.id,
      name: params.name,
      chunkingStrategyId: params.chunkingStrategyId,
      embeddingStrategyId: params.embeddingStrategyId,
      configuration: params.configuration,
    });

    if (result.isFail()) {
      return Result.fail(result.error);
    }

    return Result.ok({
      profileId: result.value.id.value,
      version: result.value.version,
    });
  }

  /**
   * Deprecates a processing profile.
   */
  async deprecateProcessingProfile(params: {
    id: string;
    reason: string;
  }): Promise<Result<DomainError, DeprecateProfileSuccess>> {
    const result = await this._processingProfile.deprecateProfile.execute({
      id: params.id,
      reason: params.reason,
    });

    if (result.isFail()) {
      return Result.fail(result.error);
    }

    return Result.ok({ profileId: result.value.id.value });
  }

  // ─── Workflow Operations ──────────────────────────────────────────────────

  /**
   * Processes content into semantic projections.
   * Chunks the content, generates embeddings, and stores vectors.
   *
   * Now requires a processingProfileId — the profile determines
   * which chunking and embedding strategies are materialized at runtime.
   */
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

  /**
   * Batch processes multiple semantic units.
   */
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
