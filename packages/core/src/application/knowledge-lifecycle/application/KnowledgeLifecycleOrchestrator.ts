import type { ContextManagementService } from "../../../contexts/context-management/service/ContextManagementService";
import type { SemanticProcessingService } from "../../../contexts/semantic-processing/service/SemanticProcessingService";
import type { KnowledgeLifecyclePort } from "../contracts/KnowledgeLifecyclePort";
import type {
  RemoveSourceInput,
  RemoveSourceResult,
  ReprocessContextInput,
  ReprocessContextResult,
  RollbackContextInput,
  RollbackContextResult,
  LinkContextsInput,
  LinkContextsResult,
  UnlinkContextsInput,
  UnlinkContextsResult,
  CreateContextInput,
  CreateContextResult,
  ArchiveContextInput,
  ArchiveContextResult,
  DeprecateContextInput,
  DeprecateContextResult,
  ActivateContextInput,
  ActivateContextResult,
} from "../contracts/dtos";
import type { Result } from "../../../shared/domain/Result";
import type { KnowledgeLifecycleError } from "../domain/KnowledgeLifecycleError";
import { KnowledgeLifecycleError as LifecycleError } from "../domain/KnowledgeLifecycleError";
import { LifecycleStep } from "../domain/LifecycleStep";
import { Result as ResultClass } from "../../../shared/domain/Result";

export interface ResolvedLifecycleDependencies {
  contextManagement: ContextManagementService;
  processing: SemanticProcessingService;
}

export class KnowledgeLifecycleOrchestrator implements KnowledgeLifecyclePort {
  private readonly _contextManagement: ContextManagementService;
  private readonly _processing: SemanticProcessingService;

  constructor(deps: ResolvedLifecycleDependencies) {
    this._contextManagement = deps.contextManagement;
    this._processing = deps.processing;
  }

  async removeSource(
    input: RemoveSourceInput,
  ): Promise<Result<KnowledgeLifecycleError, RemoveSourceResult>> {
    try {
      const result = await this._contextManagement.removeSourceFromContext({
        contextId: input.contextId,
        sourceId: input.sourceId,
      });

      if (result.isFail()) {
        return ResultClass.fail(
          LifecycleError.fromStep(LifecycleStep.RemoveSource, result.error, []),
        );
      }

      const context = result.value;
      return ResultClass.ok({
        contextId: context.id.value,
        version: context.currentVersion?.version ?? 0,
      });
    } catch (error) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.RemoveSource, error, []),
      );
    }
  }

  async reprocessContext(
    input: ReprocessContextInput,
  ): Promise<Result<KnowledgeLifecycleError, ReprocessContextResult>> {
    try {
      // In the new model, Context doesn't manage profiles per-version.
      // Reprocess validates that the context exists and signals that all active
      // sources should be re-processed with the given profile. The actual
      // re-processing of content (chunking/embedding) is delegated to the caller
      // or handled asynchronously via domain events.
      const context = await this._contextManagement.getContext(input.contextId);

      if (!context) {
        return ResultClass.fail(
          LifecycleError.fromStep(
            LifecycleStep.Reprocess,
            { message: `Context ${input.contextId} not found`, code: "CONTEXT_NOT_FOUND" },
            [],
          ),
        );
      }

      return ResultClass.ok({
        contextId: input.contextId,
        version: context.currentVersion?.version ?? 0,
      });
    } catch (error) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.Reprocess, error, []),
      );
    }
  }

  async rollbackContext(
    input: RollbackContextInput,
  ): Promise<Result<KnowledgeLifecycleError, RollbackContextResult>> {
    try {
      const result = await this._contextManagement.rollbackContext({
        contextId: input.contextId,
        targetVersion: input.targetVersion,
      });

      if (result.isFail()) {
        return ResultClass.fail(
          LifecycleError.fromStep(LifecycleStep.Rollback, result.error, []),
        );
      }

      return ResultClass.ok({
        contextId: result.value.id.value,
        currentVersion: input.targetVersion,
      });
    } catch (error) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.Rollback, error, []),
      );
    }
  }

  async linkContexts(
    input: LinkContextsInput,
  ): Promise<Result<KnowledgeLifecycleError, LinkContextsResult>> {
    try {
      const result = await this._contextManagement.linkContexts({
        fromContextId: input.sourceContextId,
        toContextId: input.targetContextId,
        relationship: input.relationshipType,
      });

      if (result.isFail()) {
        return ResultClass.fail(
          LifecycleError.fromStep(LifecycleStep.Link, result.error, []),
        );
      }

      return ResultClass.ok({
        sourceContextId: result.value.fromContextId,
        targetContextId: result.value.toContextId,
      });
    } catch (error) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.Link, error, []),
      );
    }
  }

  async unlinkContexts(
    input: UnlinkContextsInput,
  ): Promise<Result<KnowledgeLifecycleError, UnlinkContextsResult>> {
    try {
      const result = await this._contextManagement.unlinkContexts({
        fromContextId: input.sourceContextId,
        toContextId: input.targetContextId,
      });

      if (result.isFail()) {
        return ResultClass.fail(
          LifecycleError.fromStep(LifecycleStep.Unlink, result.error, []),
        );
      }

      return ResultClass.ok({
        sourceContextId: result.value.fromContextId,
        targetContextId: result.value.toContextId,
      });
    } catch (error) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.Unlink, error, []),
      );
    }
  }

  async createContext(
    input: CreateContextInput,
  ): Promise<Result<KnowledgeLifecycleError, CreateContextResult>> {
    try {
      const createResult = await this._contextManagement.createContext({
        id: input.id,
        name: input.name,
        description: input.description,
        language: input.language,
        requiredProfileId: input.requiredProfileId,
        createdBy: input.createdBy,
        tags: input.tags,
        attributes: input.attributes,
      });

      if (createResult.isFail()) {
        return ResultClass.fail(
          LifecycleError.fromStep(LifecycleStep.CreateContext, createResult.error, []),
        );
      }

      // Auto-activate for low-friction UX (Draft → Active)
      const activateResult = await this._contextManagement.activateContext({
        contextId: createResult.value.id.value,
      });

      if (activateResult.isFail()) {
        return ResultClass.fail(
          LifecycleError.fromStep(LifecycleStep.ActivateContext, activateResult.error, []),
        );
      }

      return ResultClass.ok({
        contextId: activateResult.value.id.value,
        state: activateResult.value.state,
      });
    } catch (error) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.CreateContext, error, []),
      );
    }
  }

  async archiveContext(
    input: ArchiveContextInput,
  ): Promise<Result<KnowledgeLifecycleError, ArchiveContextResult>> {
    try {
      const result = await this._contextManagement.archiveContext({
        contextId: input.contextId,
      });

      if (result.isFail()) {
        return ResultClass.fail(
          LifecycleError.fromStep(LifecycleStep.ArchiveContext, result.error, []),
        );
      }

      return ResultClass.ok({
        contextId: result.value.id.value,
        state: result.value.state,
      });
    } catch (error) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.ArchiveContext, error, []),
      );
    }
  }

  async deprecateContext(
    input: DeprecateContextInput,
  ): Promise<Result<KnowledgeLifecycleError, DeprecateContextResult>> {
    try {
      const result = await this._contextManagement.deprecateContext({
        contextId: input.contextId,
        reason: input.reason,
      });

      if (result.isFail()) {
        return ResultClass.fail(
          LifecycleError.fromStep(LifecycleStep.DeprecateContext, result.error, []),
        );
      }

      return ResultClass.ok({
        contextId: result.value.id.value,
        state: result.value.state,
      });
    } catch (error) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.DeprecateContext, error, []),
      );
    }
  }

  async activateContext(
    input: ActivateContextInput,
  ): Promise<Result<KnowledgeLifecycleError, ActivateContextResult>> {
    try {
      const result = await this._contextManagement.activateContext({
        contextId: input.contextId,
      });

      if (result.isFail()) {
        return ResultClass.fail(
          LifecycleError.fromStep(LifecycleStep.ActivateContext, result.error, []),
        );
      }

      return ResultClass.ok({
        contextId: result.value.id.value,
        state: result.value.state,
      });
    } catch (error) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.ActivateContext, error, []),
      );
    }
  }
}
