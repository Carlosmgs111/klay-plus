import type { KnowledgeLifecyclePort } from "../../application/knowledge-lifecycle/contracts/KnowledgeLifecyclePort";
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
  GetContextLineageInput,
  GetContextLineageResult,
  GenerateProjectionInput,
  GenerateProjectionResult,
} from "../../application/knowledge-lifecycle/contracts/dtos";
import type { UIResult } from "./KnowledgePipelineUIAdapter";

export class KnowledgeLifecycleUIAdapter {
  constructor(private readonly _lifecycle: KnowledgeLifecyclePort) {}

  async removeSource(input: RemoveSourceInput): Promise<UIResult<RemoveSourceResult>> {
    const result = await this._lifecycle.removeSource(input);
    return this._unwrap(result);
  }

  async reprocessContext(input: ReprocessContextInput): Promise<UIResult<ReprocessContextResult>> {
    const result = await this._lifecycle.reprocessContext(input);
    return this._unwrap(result);
  }

  async rollbackContext(input: RollbackContextInput): Promise<UIResult<RollbackContextResult>> {
    const result = await this._lifecycle.rollbackContext(input);
    return this._unwrap(result);
  }

  async linkContexts(input: LinkContextsInput): Promise<UIResult<LinkContextsResult>> {
    const result = await this._lifecycle.linkContexts(input);
    return this._unwrap(result);
  }

  async unlinkContexts(input: UnlinkContextsInput): Promise<UIResult<UnlinkContextsResult>> {
    const result = await this._lifecycle.unlinkContexts(input);
    return this._unwrap(result);
  }

  async createContext(input: CreateContextInput): Promise<UIResult<CreateContextResult>> {
    const result = await this._lifecycle.createContext(input);
    return this._unwrap(result);
  }

  async archiveContext(input: ArchiveContextInput): Promise<UIResult<ArchiveContextResult>> {
    const result = await this._lifecycle.archiveContext(input);
    return this._unwrap(result);
  }

  async deprecateContext(input: DeprecateContextInput): Promise<UIResult<DeprecateContextResult>> {
    const result = await this._lifecycle.deprecateContext(input);
    return this._unwrap(result);
  }

  async activateContext(input: ActivateContextInput): Promise<UIResult<ActivateContextResult>> {
    const result = await this._lifecycle.activateContext(input);
    return this._unwrap(result);
  }

  async getContextLineage(input: GetContextLineageInput): Promise<UIResult<GetContextLineageResult>> {
    const result = await this._lifecycle.getContextLineage(input);
    return this._unwrap(result);
  }

  async generateProjection(input: GenerateProjectionInput): Promise<UIResult<GenerateProjectionResult>> {
    const result = await this._lifecycle.generateProjection(input);
    return this._unwrap(result);
  }

  private _unwrap<T>(result: { isOk(): boolean; value: T; error: any }): UIResult<T> {
    if (result.isOk()) {
      return { success: true, data: result.value };
    }

    const error = result.error;
    return {
      success: false,
      error: {
        message: error.message ?? "Unknown error",
        code: error.code ?? "UNKNOWN",
        step: error.step,
        completedSteps: error.completedSteps,
      },
    };
  }
}
