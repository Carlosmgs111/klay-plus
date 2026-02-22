import type { SemanticUnitUseCases } from "../semantic-unit/application/index.js";
import type { LineageUseCases } from "../lineage/application/index.js";
import type { SemanticUnitRepository } from "../semantic-unit/domain/SemanticUnitRepository.js";
import type { KnowledgeLineageRepository } from "../lineage/domain/KnowledgeLineageRepository.js";
import type { ResolvedSemanticKnowledgeModules } from "./composition/infra-policies.js";
import { SemanticUnitId } from "../semantic-unit/domain/SemanticUnitId.js";
import { TransformationType } from "../lineage/domain/Transformation.js";
import { Result, tryCatchAsync } from "../../../shared/domain/Result.js";
import { DomainError, NotFoundError, OperationError } from "../../../shared/domain/errors/DomainError.js";

// ─── Facade Errors ────────────────────────────────────────────────────────────

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

// ─── Facade Result Types ─────────────────────────────────────────────────────

export interface CreateSemanticUnitWithLineageSuccess {
  unitId: string;
}

export interface VersionSemanticUnitWithLineageSuccess {
  unitId: string;
  newVersion: number;
}

export interface DeprecateSemanticUnitWithLineageSuccess {
  unitId: string;
}

// ─── Facade ──────────────────────────────────────────────────────────────────

/**
 * Application Facade for the Semantic Knowledge bounded context.
 *
 * Provides a unified entry point to all modules within the context,
 * coordinating use cases for semantic units and their lineage tracking.
 *
 * This is an Application Layer component - it does NOT contain domain logic.
 * It only coordinates existing use cases and handles cross-module workflows.
 *
 * The facade coordinates the flow:
 * 1. Semantic Unit creation/versioning/deprecation
 * 2. Lineage registration for transformations
 */
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

  // ─── Module Accessors ──────────────────────────────────────────────────────

  get semanticUnit(): SemanticUnitUseCases {
    return this._semanticUnit;
  }

  get lineage(): LineageUseCases {
    return this._lineage;
  }

  // ─── Workflow Operations ───────────────────────────────────────────────────

  /**
   * Creates a semantic unit and registers its creation in the lineage.
   * This is the main entry point for creating new semantic units.
   */
  async createSemanticUnitWithLineage(params: {
    id: string;
    sourceId: string;
    sourceType: string;
    content: string;
    language: string;
    createdBy: string;
    topics?: string[];
    summary?: string;
    tags?: string[];
    attributes?: Record<string, string>;
  }): Promise<Result<DomainError, CreateSemanticUnitWithLineageSuccess>> {
    // 1. Create the semantic unit
    const createResult = await tryCatchAsync(
      () =>
        this._semanticUnit.createSemanticUnit.execute({
          id: params.id,
          sourceId: params.sourceId,
          sourceType: params.sourceType,
          extractedAt: new Date(),
          content: params.content,
          language: params.language,
          topics: params.topics,
          summary: params.summary,
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

    // 2. Register lineage for creation (extraction transformation)
    const lineageResult = await tryCatchAsync(
      () =>
        this._lineage.registerTransformation.execute({
          semanticUnitId: params.id,
          transformationType: TransformationType.Extraction,
          strategyUsed: "initial-extraction",
          inputVersion: 0,
          outputVersion: 1,
          parameters: {
            sourceId: params.sourceId,
            sourceType: params.sourceType,
            createdBy: params.createdBy,
          },
        }),
      (error) =>
        new LineageOperationError(
          "registerTransformation",
          `Lineage registration failed: ${error}`
        )
    );

    if (lineageResult.isFail()) {
      // Note: Semantic unit was created but lineage failed
      // In production, consider compensation/saga pattern
      return Result.fail(lineageResult.error);
    }

    return Result.ok({ unitId: params.id });
  }

  /**
   * Versions a semantic unit and registers the transformation in the lineage.
   */
  async versionSemanticUnitWithLineage(params: {
    unitId: string;
    content: string;
    language: string;
    reason: string;
    transformationType?: typeof TransformationType[keyof typeof TransformationType];
    strategyUsed?: string;
    topics?: string[];
    summary?: string;
    parameters?: Record<string, unknown>;
  }): Promise<Result<DomainError, VersionSemanticUnitWithLineageSuccess>> {
    // 1. Get current version
    const unitId = SemanticUnitId.create(params.unitId);
    const unit = await this._semanticUnitRepository.findById(unitId);

    if (!unit) {
      return Result.fail(new SemanticUnitNotFoundError(params.unitId));
    }

    const currentVersion = unit.currentVersion.version;

    // 2. Version the semantic unit
    const versionResult = await tryCatchAsync(
      () =>
        this._semanticUnit.versionSemanticUnit.execute({
          unitId: params.unitId,
          content: params.content,
          language: params.language,
          reason: params.reason,
          topics: params.topics,
          summary: params.summary,
        }),
      (error) =>
        new SemanticUnitOperationError(
          "versionSemanticUnit",
          `Version semantic unit failed: ${error}`
        )
    );

    if (versionResult.isFail()) {
      return Result.fail(versionResult.error);
    }

    // 3. Register lineage for versioning
    const newVersion = currentVersion + 1;
    const lineageResult = await tryCatchAsync(
      () =>
        this._lineage.registerTransformation.execute({
          semanticUnitId: params.unitId,
          transformationType: params.transformationType ?? TransformationType.Enrichment,
          strategyUsed: params.strategyUsed ?? "manual-version",
          inputVersion: currentVersion,
          outputVersion: newVersion,
          parameters: {
            reason: params.reason,
            ...params.parameters,
          },
        }),
      (error) =>
        new LineageOperationError(
          "registerTransformation",
          `Lineage registration failed: ${error}`
        )
    );

    if (lineageResult.isFail()) {
      return Result.fail(lineageResult.error);
    }

    return Result.ok({ unitId: params.unitId, newVersion });
  }

  /**
   * Deprecates a semantic unit and registers the deprecation in the lineage.
   */
  async deprecateSemanticUnitWithLineage(params: {
    unitId: string;
    reason: string;
  }): Promise<Result<DomainError, DeprecateSemanticUnitWithLineageSuccess>> {
    // 1. Get current version
    const unitId = SemanticUnitId.create(params.unitId);
    const unit = await this._semanticUnitRepository.findById(unitId);

    if (!unit) {
      return Result.fail(new SemanticUnitNotFoundError(params.unitId));
    }

    const currentVersion = unit.currentVersion.version;

    // 2. Deprecate the semantic unit
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

    // 3. Register lineage for deprecation (special transformation)
    const lineageResult = await tryCatchAsync(
      () =>
        this._lineage.registerTransformation.execute({
          semanticUnitId: params.unitId,
          transformationType: TransformationType.Merge, // Using Merge as "deprecation" marker
          strategyUsed: "deprecation",
          inputVersion: currentVersion,
          outputVersion: currentVersion, // No new version on deprecation
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

    if (lineageResult.isFail()) {
      return Result.fail(lineageResult.error);
    }

    return Result.ok({ unitId: params.unitId });
  }

  /**
   * Batch creation of semantic units with lineage tracking.
   */
  async batchCreateSemanticUnitsWithLineage(
    units: Array<{
      id: string;
      sourceId: string;
      sourceType: string;
      content: string;
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
}
