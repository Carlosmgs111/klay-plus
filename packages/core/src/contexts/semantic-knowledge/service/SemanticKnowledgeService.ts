import type { SemanticUnitRepository } from "../semantic-unit/domain/SemanticUnitRepository";
import type { KnowledgeLineageRepository } from "../lineage/domain/KnowledgeLineageRepository";
import type { EventPublisher } from "../../../shared/domain/EventPublisher";
import type { ResolvedSemanticKnowledgeModules } from "../composition/factory";
import { SemanticUnit } from "../semantic-unit/domain/SemanticUnit";
import { SemanticUnitId } from "../semantic-unit/domain/SemanticUnitId";
import { UnitMetadata } from "../semantic-unit/domain/UnitMetadata";
import { UnitSource } from "../semantic-unit/domain/UnitSource";
import { KnowledgeLineage } from "../lineage/domain/KnowledgeLineage";
import { LineageId } from "../lineage/domain/LineageId";
import { Transformation, TransformationType } from "../lineage/domain/Transformation";
import { Trace } from "../lineage/domain/Trace";
import { Result, tryCatchAsync } from "../../../shared/domain/Result";
import { DomainError, NotFoundError, OperationError } from "../../../shared/domain/errors/DomainError";

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

export class SemanticKnowledgeService {
  private readonly _semanticUnitRepository: SemanticUnitRepository;
  private readonly _semanticUnitEventPublisher: EventPublisher;
  private readonly _lineageRepository: KnowledgeLineageRepository;
  private readonly _lineageEventPublisher: EventPublisher;

  constructor(modules: ResolvedSemanticKnowledgeModules) {
    this._semanticUnitRepository = modules.semanticUnitRepository;
    this._semanticUnitEventPublisher = modules.semanticUnitEventPublisher;
    this._lineageRepository = modules.lineageRepository;
    this._lineageEventPublisher = modules.lineageEventPublisher;
  }

  // ── Semantic Unit operations ─────────────────────────────────────────

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
      async () => {
        const unitId = SemanticUnitId.create(params.id);
        const exists = await this._semanticUnitRepository.exists(unitId);
        if (exists) {
          throw new Error(`SemanticUnit ${params.id} already exists`);
        }

        const metadata = UnitMetadata.create(
          params.createdBy,
          params.tags ?? [],
          params.attributes ?? {},
        );

        const unit = SemanticUnit.create(
          unitId,
          params.name,
          params.description,
          params.language,
          metadata,
        );

        await this._semanticUnitRepository.save(unit);
        await this._semanticUnitEventPublisher.publishAll(unit.clearEvents());
      },
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
    await this._registerTransformation({
      semanticUnitId: params.id,
      transformationType: TransformationType.Extraction,
      strategyUsed: "initial-creation",
      inputVersion: 0,
      outputVersion: 0,
      parameters: { createdBy: params.createdBy },
    });

    return Result.ok({ unitId: params.id });
  }

  /**
   * Backward-compat: alias for createSemanticUnit.
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
      async () => {
        const unitId = SemanticUnitId.create(params.unitId);
        const unit = await this._semanticUnitRepository.findById(unitId);
        if (!unit) {
          throw new Error(`SemanticUnit ${params.unitId} not found`);
        }

        const source = UnitSource.create(
          params.sourceId,
          params.sourceType,
          params.extractedContent,
          params.contentHash,
          params.resourceId,
        );

        unit.addSource(source, params.processingProfileId, params.processingProfileVersion);

        await this._semanticUnitRepository.save(unit);
        await this._semanticUnitEventPublisher.publishAll(unit.clearEvents());
      },
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
    await this._registerTransformation({
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
    });

    return Result.ok({ unitId: params.unitId, version });
  }

  async removeSourceFromSemanticUnit(params: {
    unitId: string;
    sourceId: string;
  }): Promise<Result<DomainError, RemoveSourceSuccess>> {
    const result = await tryCatchAsync(
      async () => {
        const unitId = SemanticUnitId.create(params.unitId);
        const unit = await this._semanticUnitRepository.findById(unitId);
        if (!unit) {
          throw new Error(`SemanticUnit ${params.unitId} not found`);
        }

        unit.removeSource(params.sourceId);

        await this._semanticUnitRepository.save(unit);
        await this._semanticUnitEventPublisher.publishAll(unit.clearEvents());
      },
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

  async reprocessSemanticUnit(params: {
    unitId: string;
    processingProfileId: string;
    processingProfileVersion: number;
    reason: string;
  }): Promise<Result<DomainError, ReprocessSuccess>> {
    const result = await tryCatchAsync(
      async () => {
        const unitId = SemanticUnitId.create(params.unitId);
        const unit = await this._semanticUnitRepository.findById(unitId);
        if (!unit) {
          throw new Error(`SemanticUnit ${params.unitId} not found`);
        }

        unit.reprocess(
          params.processingProfileId,
          params.processingProfileVersion,
          params.reason,
        );

        await this._semanticUnitRepository.save(unit);
        await this._semanticUnitEventPublisher.publishAll(unit.clearEvents());
      },
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

  async rollbackSemanticUnit(params: {
    unitId: string;
    targetVersion: number;
  }): Promise<Result<DomainError, RollbackSuccess>> {
    const result = await tryCatchAsync(
      async () => {
        const unitId = SemanticUnitId.create(params.unitId);
        const unit = await this._semanticUnitRepository.findById(unitId);
        if (!unit) {
          throw new Error(`SemanticUnit ${params.unitId} not found`);
        }

        unit.rollbackToVersion(params.targetVersion);

        await this._semanticUnitRepository.save(unit);
        await this._semanticUnitEventPublisher.publishAll(unit.clearEvents());
      },
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
      async () => {
        unit.deprecate(params.reason);
        await this._semanticUnitRepository.save(unit);
        await this._semanticUnitEventPublisher.publishAll(unit.clearEvents());
      },
      (error) =>
        new SemanticUnitOperationError(
          "deprecateSemanticUnit",
          `Deprecate semantic unit failed: ${error}`
        )
    );

    if (deprecateResult.isFail()) {
      return Result.fail(deprecateResult.error);
    }

    await this._registerTransformation({
      semanticUnitId: params.unitId,
      transformationType: TransformationType.Merge,
      strategyUsed: "deprecation",
      inputVersion: currentVersion,
      outputVersion: currentVersion,
      parameters: { reason: params.reason, deprecated: true },
    });

    return Result.ok({ unitId: params.unitId });
  }

  // ── Lineage operations ───────────────────────────────────────────────

  async getLineageForUnit(unitId: string): Promise<Result<DomainError, unknown>> {
    const lineage = await this._lineageRepository.findBySemanticUnitId(unitId);

    if (!lineage) {
      return Result.fail(new LineageNotFoundError(unitId));
    }

    return Result.ok(lineage);
  }

  async linkSemanticUnits(params: {
    fromUnitId: string;
    toUnitId: string;
    relationship: string;
  }): Promise<Result<DomainError, { fromUnitId: string; toUnitId: string }>> {
    const result = await tryCatchAsync(
      async () => {
        if (params.fromUnitId === params.toUnitId) {
          throw new Error("Cannot link a semantic unit to itself");
        }

        let lineage = await this._lineageRepository.findBySemanticUnitId(params.fromUnitId);

        if (!lineage) {
          const lineageId = LineageId.create(crypto.randomUUID());
          lineage = KnowledgeLineage.create(lineageId, params.fromUnitId);
        }

        const duplicate = lineage.traces.some(
          (t) =>
            t.fromUnitId === params.fromUnitId &&
            t.toUnitId === params.toUnitId &&
            t.relationship === params.relationship,
        );

        if (duplicate) {
          throw new Error(
            `Link already exists: ${params.fromUnitId} --[${params.relationship}]--> ${params.toUnitId}`,
          );
        }

        const trace = Trace.create(
          params.fromUnitId,
          params.toUnitId,
          params.relationship,
        );

        lineage.addTrace(trace);

        await this._lineageRepository.save(lineage);
        await this._lineageEventPublisher.publishAll(lineage.clearEvents());
      },
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
      async () => {
        // Outbound links
        const lineage = await this._lineageRepository.findBySemanticUnitId(params.unitId);
        const outbound =
          lineage?.traces?.filter(
            (t) => !params.relationship || t.relationship === params.relationship,
          ) ?? [];

        // Inbound links
        const inboundLineages = await this._lineageRepository.findByTraceTargetUnitId(
          params.unitId,
        );
        const inbound = inboundLineages.flatMap((l) =>
          l.traces.filter(
            (t) =>
              t.toUnitId === params.unitId &&
              (!params.relationship || t.relationship === params.relationship),
          ),
        );

        // Combine and deduplicate
        const all = [...outbound, ...inbound];
        const seen = new Set<string>();

        return all
          .filter((t) => {
            const key = `${t.fromUnitId}-${t.toUnitId}-${t.relationship}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map((t) => ({
            fromUnitId: t.fromUnitId,
            toUnitId: t.toUnitId,
            relationship: t.relationship,
            createdAt: t.createdAt,
          }));
      },
      (error) =>
        new LineageOperationError("getLinkedUnits", String(error)),
    );

    if (result.isFail()) {
      return Result.fail(result.error);
    }

    return Result.ok({ links: result.value });
  }

  // ── Batch operations ─────────────────────────────────────────────────

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
          return { unitId: result.value.unitId, success: true };
        }
        return { unitId: units[index].id, success: false, error: result.error.message };
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

  // ── Private helpers ──────────────────────────────────────────────────

  private async _registerTransformation(params: {
    semanticUnitId: string;
    transformationType: TransformationType;
    strategyUsed: string;
    inputVersion: number;
    outputVersion: number;
    parameters?: Record<string, unknown>;
  }): Promise<void> {
    let lineage = await this._lineageRepository.findBySemanticUnitId(params.semanticUnitId);

    if (!lineage) {
      const lineageId = LineageId.create(crypto.randomUUID());
      lineage = KnowledgeLineage.create(lineageId, params.semanticUnitId);
    }

    const transformation = Transformation.create(
      params.transformationType,
      params.strategyUsed,
      params.inputVersion,
      params.outputVersion,
      params.parameters ?? {},
    );

    lineage.registerTransformation(transformation);

    await this._lineageRepository.save(lineage);
    await this._lineageEventPublisher.publishAll(lineage.clearEvents());
  }
}
