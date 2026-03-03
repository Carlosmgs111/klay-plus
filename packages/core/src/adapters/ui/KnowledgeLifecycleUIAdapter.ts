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
