import type { SemanticUnitUseCases } from "../semantic-unit/application/index.js";
import type { LineageUseCases } from "../lineage/application/index.js";
import type { SemanticUnitRepository } from "../semantic-unit/domain/SemanticUnitRepository.js";
import type { KnowledgeLineageRepository } from "../lineage/domain/KnowledgeLineageRepository.js";
import type { ResolvedSemanticKnowledgeModules } from "./composition/infra-policies.js";
import { SemanticUnitId } from "../semantic-unit/domain/SemanticUnitId.js";
import { TransformationType } from "../lineage/domain/Transformation.js";
import { Result, tryCatchAsync } from "../../../shared/domain/Result.js";
import { DomainError, NotFoundError, OperationError } from "../../../shared/domain/errors/DomainError.js";

export class SemanticUnitNotFoundError extends NotFoundError {
  constructor(id: string) {
    super("SemanticUnit", id);
  }
}

export class SemanticUnitAlreadyExistsError extends DomainError {
  constructor(id: string) {
    super(`SemanticUnit already exists: ${id}`, "SEMANTIC_UNIT_ALREADY_EXISTS", {
      id,
    });
  }
}

export class SemanticUnitOperationError extends OperationError {
  constructor(operation: string, reason: string) {
    super(operation, reason);
  }
}

export class LineageNotFoundError extends NotFoundError {
  constructor(unitId: string) {
    super("Lineage", unitId);
  }
}

export class LineageOperationError extends OperationError {
  constructor(operation: string, reason: string) {
    super(operation, reason);
  }
}

export interface CreateSemanticUnitSuccess {
  unitId: string;
}

export interface AddSourceSuccess {
  unitId: string;
  version: number;
}

export interface RemoveSourceSuccess {
  unitId: string;
  version: number;
}

export interface ReprocessSuccess {
  unitId: string;
  version: number;
}

export interface RollbackSuccess {
  unitId: string;
  targetVersion: number;
}

export interface DeprecateSemanticUnitWithLineageSuccess {
  unitId: string;
}

// Backward-compat aliases
export type CreateSemanticUnitWithLineageSuccess = CreateSemanticUnitSuccess;

export class SemanticKnowledgeFacade {
  private readonly _semanticUnit: SemanticUnitUseCases;
  private readonly _lineage: LineageUseCases;
  private readonly _semanticUnitRepository: SemanticUnitRepository;
  private readonly _lineageRepository: KnowledgeLineageRepository;

  constructor(modules: ResolvedSemanticKnowledgeModules) {
    this._semanticUnit = modules.semanticUnit;
    this._lineage = modules.lineage;
    this._semanticUnitRepository = modules.semanticUnitRepository;
    this._lineageRepository = modules.lineageRepository;
  }

  get semanticUnit(): SemanticUnitUseCases {
    return this._semanticUnit;
  }

  get lineage(): LineageUseCases {
    return this._lineage;
  }

  /**
   * Creates a semantic unit (empty, no sources yet) and registers lineage.
   */
  async createSemanticUnit(params: {
    id: string;
    name: string;
    description: string;
    language: string;
    createdBy: string;
    tags?: string[];
    attributes?: Record<string, string>;
  }): Promise<Result<DomainError, CreateSemanticUnitSuccess>> {
    const createResult = await tryCatchAsync(
      () =>
        this._semanticUnit.createSemanticUnit.execute({
          id: params.id,
          name: params.name,
          description: params.description,
          language: params.language,
          createdBy: params.createdBy,
          tags: params.tags,
          attributes: params.attributes,
        }),
      (error) => {
        if (error instanceof Error && error.message.includes("already exists")) {
          return new SemanticUnitAlreadyExistsError(params.id);
        }
        return new SemanticUnitOperationError(
          "createSemanticUnit",
          String(error)
        );
      }
    );

    if (createResult.isFail()) {
      return Result.fail(createResult.error);
    }

    // Register lineage for creation
    await tryCatchAsync(
      () =>
        this._lineage.registerTransformation.execute({
          semanticUnitId: params.id,
          transformationType: TransformationType.Extraction,
          strategyUsed: "initial-creation",
          inputVersion: 0,
          outputVersion: 0,
          parameters: {
            createdBy: params.createdBy,
          },
        }),
      (error) =>
        new LineageOperationError(
          "registerTransformation",
          `Lineage registration failed: ${error}`
        )
    );

    return Result.ok({ unitId: params.id });
  }

  /**
   * Backward-compat: alias for createSemanticUnit.
   * Legacy callers that pass content/sourceId/sourceType will have those fields ignored.
   */
  async createSemanticUnitWithLineage(params: {
    id: string;
    name?: string;
    description?: string;
    sourceId?: string;
    sourceType?: string;
    content?: string;
    language: string;
    createdBy: string;
    topics?: string[];
    summary?: string;
    tags?: string[];
    attributes?: Record<string, string>;
  }): Promise<Result<DomainError, CreateSemanticUnitSuccess>> {
    return this.createSemanticUnit({
      id: params.id,
      name: params.name ?? params.content?.slice(0, 50) ?? "Untitled",
      description: params.description ?? params.summary ?? "",
      language: params.language,
      createdBy: params.createdBy,
      tags: params.tags,
      attributes: params.attributes,
    });
  }

  /**
   * Adds a source to a semantic unit (creates a new version).
   */
  async addSourceToSemanticUnit(params: {
    unitId: string;
    sourceId: string;
    sourceType: string;
    resourceId?: string;
    extractedContent: string;
    contentHash: string;
    processingProfileId: string;
    processingProfileVersion: number;
  }): Promise<Result<DomainError, AddSourceSuccess>> {
    const result = await tryCatchAsync(
      () =>
        this._semanticUnit.addSource.execute({
          unitId: params.unitId,
          sourceId: params.sourceId,
          sourceType: params.sourceType,
          resourceId: params.resourceId,
          extractedContent: params.extractedContent,
          contentHash: params.contentHash,
          processingProfileId: params.processingProfileId,
          processingProfileVersion: params.processingProfileVersion,
        }),
      (error) => {
        if (error instanceof Error && error.message.includes("not found")) {
          return new SemanticUnitNotFoundError(params.unitId);
        }
        return new SemanticUnitOperationError("addSource", String(error));
      }
    );

    if (result.isFail()) {
      return Result.fail(result.error);
    }

    // Get the new version number
    const unitId = SemanticUnitId.create(params.unitId);
    const unit = await this._semanticUnitRepository.findById(unitId);
    const version = unit?.currentVersion?.version ?? 1;

    // Register lineage
    await tryCatchAsync(
      () =>
        this._lineage.registerTransformation.execute({
          semanticUnitId: params.unitId,
          transformationType: TransformationType.Extraction,
          strategyUsed: "source-addition",
          inputVersion: version - 1,
          outputVersion: version,
          parameters: {
            sourceId: params.sourceId,
            sourceType: params.sourceType,
            processingProfileId: params.processingProfileId,
          },
        }),
      (error) =>
        new LineageOperationError(
          "registerTransformation",
          `Lineage registration failed: ${error}`
        )
    );

    return Result.ok({ unitId: params.unitId, version });
  }

  /**
   * Removes a source from a semantic unit (creates a new version without it).
   */
  async removeSourceFromSemanticUnit(params: {
    unitId: string;
    sourceId: string;
  }): Promise<Result<DomainError, RemoveSourceSuccess>> {
    const result = await tryCatchAsync(
      () =>
        this._semanticUnit.removeSource.execute({
          unitId: params.unitId,
          sourceId: params.sourceId,
        }),
      (error) => {
        if (error instanceof Error && error.message.includes("not found")) {
          return new SemanticUnitNotFoundError(params.unitId);
        }
        return new SemanticUnitOperationError("removeSource", String(error));
      }
    );

    if (result.isFail()) {
      return Result.fail(result.error);
    }

    const unitId = SemanticUnitId.create(params.unitId);
    const unit = await this._semanticUnitRepository.findById(unitId);
    const version = unit?.currentVersion?.version ?? 0;

    return Result.ok({ unitId: params.unitId, version });
  }

  /**
   * Reprocesses all sources of a semantic unit with a new processing profile.
   */
  async reprocessSemanticUnit(params: {
    unitId: string;
    processingProfileId: string;
    processingProfileVersion: number;
    reason: string;
  }): Promise<Result<DomainError, ReprocessSuccess>> {
    const result = await tryCatchAsync(
      () =>
        this._semanticUnit.reprocessSemanticUnit.execute({
          unitId: params.unitId,
          processingProfileId: params.processingProfileId,
          processingProfileVersion: params.processingProfileVersion,
          reason: params.reason,
        }),
      (error) => {
        if (error instanceof Error && error.message.includes("not found")) {
          return new SemanticUnitNotFoundError(params.unitId);
        }
        return new SemanticUnitOperationError("reprocess", String(error));
      }
    );

    if (result.isFail()) {
      return Result.fail(result.error);
    }

    const unitId = SemanticUnitId.create(params.unitId);
    const unit = await this._semanticUnitRepository.findById(unitId);
    const version = unit?.currentVersion?.version ?? 0;

    return Result.ok({ unitId: params.unitId, version });
  }

  /**
   * Rolls back a semantic unit to a previous version (non-destructive pointer move).
   */
  async rollbackSemanticUnit(params: {
    unitId: string;
    targetVersion: number;
  }): Promise<Result<DomainError, RollbackSuccess>> {
    const result = await tryCatchAsync(
      () =>
        this._semanticUnit.rollbackSemanticUnit.execute({
          unitId: params.unitId,
          targetVersion: params.targetVersion,
        }),
      (error) => {
        if (error instanceof Error && error.message.includes("not found")) {
          return new SemanticUnitNotFoundError(params.unitId);
        }
        return new SemanticUnitOperationError("rollback", String(error));
      }
    );

    if (result.isFail()) {
      return Result.fail(result.error);
    }

    return Result.ok({ unitId: params.unitId, targetVersion: params.targetVersion });
  }

  /**
   * Deprecates a semantic unit and registers the deprecation in the lineage.
   */
  async deprecateSemanticUnitWithLineage(params: {
    unitId: string;
    reason: string;
  }): Promise<Result<DomainError, DeprecateSemanticUnitWithLineageSuccess>> {
    const unitId = SemanticUnitId.create(params.unitId);
    const unit = await this._semanticUnitRepository.findById(unitId);

    if (!unit) {
      return Result.fail(new SemanticUnitNotFoundError(params.unitId));
    }

    const currentVersion = unit.currentVersion?.version ?? 0;

    const deprecateResult = await tryCatchAsync(
      () =>
        this._semanticUnit.deprecateSemanticUnit.execute({
          unitId: params.unitId,
          reason: params.reason,
        }),
      (error) =>
        new SemanticUnitOperationError(
          "deprecateSemanticUnit",
          `Deprecate semantic unit failed: ${error}`
        )
    );

    if (deprecateResult.isFail()) {
      return Result.fail(deprecateResult.error);
    }

    await tryCatchAsync(
      () =>
        this._lineage.registerTransformation.execute({
          semanticUnitId: params.unitId,
          transformationType: TransformationType.Merge,
          strategyUsed: "deprecation",
          inputVersion: currentVersion,
          outputVersion: currentVersion,
          parameters: {
            reason: params.reason,
            deprecated: true,
          },
        }),
      (error) =>
        new LineageOperationError(
          "registerTransformation",
          `Lineage registration failed: ${error}`
        )
    );

    return Result.ok({ unitId: params.unitId });
  }

  /**
   * Batch creation of semantic units with lineage tracking.
   */
  async batchCreateSemanticUnitsWithLineage(
    units: Array<{
      id: string;
      name?: string;
      description?: string;
      sourceId?: string;
      sourceType?: string;
      content?: string;
      language: string;
      createdBy: string;
      topics?: string[];
      summary?: string;
      tags?: string[];
      attributes?: Record<string, string>;
    }>
  ): Promise<
    Array<{
      unitId: string;
      success: boolean;
      error?: string;
    }>
  > {
    const results = await Promise.allSettled(
      units.map((unit) => this.createSemanticUnitWithLineage(unit))
    );

    return results.map((promiseResult, index) => {
      if (promiseResult.status === "fulfilled") {
        const result = promiseResult.value;
        if (result.isOk()) {
          return {
            unitId: result.value.unitId,
            success: true,
          };
        }
        return {
          unitId: units[index].id,
          success: false,
          error: result.error.message,
        };
      }
      return {
        unitId: units[index].id,
        success: false,
        error:
          promiseResult.reason instanceof Error
            ? promiseResult.reason.message
            : String(promiseResult.reason),
      };
    });
  }

  /**
   * Gets the lineage for a semantic unit.
   */
  async getLineageForUnit(unitId: string): Promise<Result<DomainError, unknown>> {
    const lineage = await this._lineageRepository.findBySemanticUnitId(unitId);

    if (!lineage) {
      return Result.fail(new LineageNotFoundError(unitId));
    }

    return Result.ok(lineage);
  }

  /**
   * Links two semantic units with a named relationship.
   */
  async linkSemanticUnits(params: {
    fromUnitId: string;
    toUnitId: string;
    relationship: string;
  }): Promise<Result<DomainError, { fromUnitId: string; toUnitId: string }>> {
    const result = await tryCatchAsync(
      () => this._lineage.linkSemanticUnits.execute(params),
      (error) =>
        new LineageOperationError("linkSemanticUnits", String(error)),
    );

    if (result.isFail()) {
      return Result.fail(result.error);
    }

    return Result.ok({
      fromUnitId: params.fromUnitId,
      toUnitId: params.toUnitId,
    });
  }

  /**
   * Gets all linked units for a semantic unit (both inbound and outbound).
   */
  async getLinkedUnits(params: {
    unitId: string;
    relationship?: string;
  }): Promise<
    Result<
      DomainError,
      {
        links: Array<{
          fromUnitId: string;
          toUnitId: string;
          relationship: string;
          createdAt: Date;
        }>;
      }
    >
  > {
    const result = await tryCatchAsync(
      () => this._lineage.getLinkedUnits.execute(params),
      (error) =>
        new LineageOperationError("getLinkedUnits", String(error)),
    );

    if (result.isFail()) {
      return Result.fail(result.error);
    }

    return Result.ok({ links: result.value });
  }
}
