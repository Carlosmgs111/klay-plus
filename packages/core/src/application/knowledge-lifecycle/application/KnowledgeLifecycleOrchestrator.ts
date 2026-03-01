import type { SemanticKnowledgeService } from "../../../contexts/semantic-knowledge/service/SemanticKnowledgeService";
import type { SemanticProcessingService } from "../../../contexts/semantic-processing/service/SemanticProcessingService";
import type { KnowledgeLifecyclePort } from "../contracts/KnowledgeLifecyclePort";
import type {
  RemoveSourceInput,
  RemoveSourceResult,
  ReprocessUnitInput,
  ReprocessUnitResult,
  RollbackUnitInput,
  RollbackUnitResult,
  LinkUnitsInput,
  LinkUnitsResult,
  UnlinkUnitsInput,
  UnlinkUnitsResult,
} from "../contracts/dtos";
import type { Result } from "../../../shared/domain/Result";
import type { KnowledgeLifecycleError } from "../domain/KnowledgeLifecycleError";
import { KnowledgeLifecycleError as LifecycleError } from "../domain/KnowledgeLifecycleError";
import { LifecycleStep } from "../domain/LifecycleStep";
import { Result as ResultClass } from "../../../shared/domain/Result";

export interface ResolvedLifecycleDependencies {
  knowledge: SemanticKnowledgeService;
  processing: SemanticProcessingService;
}

export class KnowledgeLifecycleOrchestrator implements KnowledgeLifecyclePort {
  private readonly _knowledge: SemanticKnowledgeService;
  private readonly _processing: SemanticProcessingService;

  constructor(deps: ResolvedLifecycleDependencies) {
    this._knowledge = deps.knowledge;
    this._processing = deps.processing;
  }

  async removeSource(
    input: RemoveSourceInput,
  ): Promise<Result<KnowledgeLifecycleError, RemoveSourceResult>> {
    try {
      const result = await this._knowledge.removeSourceFromSemanticUnit({
        unitId: input.unitId,
        sourceId: input.sourceId,
      });

      if (result.isFail()) {
        return ResultClass.fail(
          LifecycleError.fromStep(LifecycleStep.RemoveSource, result.error, []),
        );
      }

      return ResultClass.ok({
        unitId: result.value.unitId,
        version: result.value.version,
      });
    } catch (error) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.RemoveSource, error, []),
      );
    }
  }

  async reprocessUnit(
    input: ReprocessUnitInput,
  ): Promise<Result<KnowledgeLifecycleError, ReprocessUnitResult>> {
    try {
      const result = await this._knowledge.reprocessSemanticUnit({
        unitId: input.unitId,
        processingProfileId: input.profileId,
        processingProfileVersion: 1,
        reason: "Reprocess via lifecycle",
      });

      if (result.isFail()) {
        return ResultClass.fail(
          LifecycleError.fromStep(LifecycleStep.Reprocess, result.error, []),
        );
      }

      return ResultClass.ok({
        unitId: result.value.unitId,
        version: result.value.version,
      });
    } catch (error) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.Reprocess, error, []),
      );
    }
  }

  async rollbackUnit(
    input: RollbackUnitInput,
  ): Promise<Result<KnowledgeLifecycleError, RollbackUnitResult>> {
    try {
      const result = await this._knowledge.rollbackSemanticUnit({
        unitId: input.unitId,
        targetVersion: input.targetVersion,
      });

      if (result.isFail()) {
        return ResultClass.fail(
          LifecycleError.fromStep(LifecycleStep.Rollback, result.error, []),
        );
      }

      return ResultClass.ok({
        unitId: result.value.unitId,
        currentVersion: result.value.targetVersion,
      });
    } catch (error) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.Rollback, error, []),
      );
    }
  }

  async linkUnits(
    input: LinkUnitsInput,
  ): Promise<Result<KnowledgeLifecycleError, LinkUnitsResult>> {
    try {
      const result = await this._knowledge.linkSemanticUnits({
        fromUnitId: input.sourceUnitId,
        toUnitId: input.targetUnitId,
        relationship: input.relationshipType,
      });

      if (result.isFail()) {
        return ResultClass.fail(
          LifecycleError.fromStep(LifecycleStep.Link, result.error, []),
        );
      }

      return ResultClass.ok({
        sourceUnitId: result.value.fromUnitId,
        targetUnitId: result.value.toUnitId,
      });
    } catch (error) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.Link, error, []),
      );
    }
  }

  async unlinkUnits(
    input: UnlinkUnitsInput,
  ): Promise<Result<KnowledgeLifecycleError, UnlinkUnitsResult>> {
    try {
      const result = await this._knowledge.unlinkSemanticUnits({
        fromUnitId: input.sourceUnitId,
        toUnitId: input.targetUnitId,
      });

      if (result.isFail()) {
        return ResultClass.fail(
          LifecycleError.fromStep(LifecycleStep.Unlink, result.error, []),
        );
      }

      return ResultClass.ok({
        sourceUnitId: result.value.fromUnitId,
        targetUnitId: result.value.toUnitId,
      });
    } catch (error) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.Unlink, error, []),
      );
    }
  }
}
