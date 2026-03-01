import type { KnowledgeLifecyclePort } from "../../application/knowledge-lifecycle/contracts/KnowledgeLifecyclePort";
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
} from "../../application/knowledge-lifecycle/contracts/dtos";
import type { UIResult } from "./KnowledgePipelineUIAdapter";

export class KnowledgeLifecycleUIAdapter {
  constructor(private readonly _lifecycle: KnowledgeLifecyclePort) {}

  async removeSource(input: RemoveSourceInput): Promise<UIResult<RemoveSourceResult>> {
    const result = await this._lifecycle.removeSource(input);
    return this._unwrap(result);
  }

  async reprocessUnit(input: ReprocessUnitInput): Promise<UIResult<ReprocessUnitResult>> {
    const result = await this._lifecycle.reprocessUnit(input);
    return this._unwrap(result);
  }

  async rollbackUnit(input: RollbackUnitInput): Promise<UIResult<RollbackUnitResult>> {
    const result = await this._lifecycle.rollbackUnit(input);
    return this._unwrap(result);
  }

  async linkUnits(input: LinkUnitsInput): Promise<UIResult<LinkUnitsResult>> {
    const result = await this._lifecycle.linkUnits(input);
    return this._unwrap(result);
  }

  async unlinkUnits(input: UnlinkUnitsInput): Promise<UIResult<UnlinkUnitsResult>> {
    const result = await this._lifecycle.unlinkUnits(input);
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
