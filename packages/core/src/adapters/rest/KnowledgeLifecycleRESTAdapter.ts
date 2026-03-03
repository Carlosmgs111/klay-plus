import type { KnowledgeLifecyclePort } from "../../application/knowledge-lifecycle/contracts/KnowledgeLifecyclePort";
import type {
  RemoveSourceInput,
  ReprocessContextInput,
  RollbackContextInput,
  LinkContextsInput,
  UnlinkContextsInput,
} from "../../application/knowledge-lifecycle/contracts/dtos";
import type { RESTRequest, RESTResponse } from "./KnowledgePipelineRESTAdapter";

export class KnowledgeLifecycleRESTAdapter {
  constructor(private readonly _lifecycle: KnowledgeLifecyclePort) {}

  async removeSource(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as RemoveSourceInput;
    const result = await this._lifecycle.removeSource(input);
    return this._toResponse(result);
  }

  async reprocessContext(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as ReprocessContextInput;
    const result = await this._lifecycle.reprocessContext(input);
    return this._toResponse(result);
  }

  async rollbackContext(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as RollbackContextInput;
    const result = await this._lifecycle.rollbackContext(input);
    return this._toResponse(result);
  }

  async linkContexts(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as LinkContextsInput;
    const result = await this._lifecycle.linkContexts(input);
    return this._toResponse(result);
  }

  async unlinkContexts(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as UnlinkContextsInput;
    const result = await this._lifecycle.unlinkContexts(input);
    return this._toResponse(result);
  }

  private _toResponse<T>(result: { isOk(): boolean; value: T; error: any }): RESTResponse {
    if (result.isOk()) {
      return {
        status: 200,
        body: { success: true, data: result.value },
        headers: { "Content-Type": "application/json" },
      };
    }

    const error = result.error;
    return {
      status: 422,
      body: {
        success: false,
        error: {
          message: error.message ?? "Unknown error",
          code: error.code ?? "UNKNOWN",
          step: error.step,
          completedSteps: error.completedSteps,
        },
      },
      headers: { "Content-Type": "application/json" },
    };
  }
}
