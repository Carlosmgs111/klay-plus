import type { KnowledgeLifecyclePort } from "../../application/knowledge-lifecycle/contracts/KnowledgeLifecyclePort";
import type {
  RemoveSourceInput,
  ReprocessUnitInput,
  RollbackUnitInput,
  LinkUnitsInput,
  UnlinkUnitsInput,
} from "../../application/knowledge-lifecycle/contracts/dtos";
import type { RESTRequest, RESTResponse } from "./KnowledgePipelineRESTAdapter";

export class KnowledgeLifecycleRESTAdapter {
  constructor(private readonly _lifecycle: KnowledgeLifecyclePort) {}

  async removeSource(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as RemoveSourceInput;
    const result = await this._lifecycle.removeSource(input);
    return this._toResponse(result);
  }

  async reprocessUnit(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as ReprocessUnitInput;
    const result = await this._lifecycle.reprocessUnit(input);
    return this._toResponse(result);
  }

  async rollbackUnit(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as RollbackUnitInput;
    const result = await this._lifecycle.rollbackUnit(input);
    return this._toResponse(result);
  }

  async linkUnits(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as LinkUnitsInput;
    const result = await this._lifecycle.linkUnits(input);
    return this._toResponse(result);
  }

  async unlinkUnits(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as UnlinkUnitsInput;
    const result = await this._lifecycle.unlinkUnits(input);
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
