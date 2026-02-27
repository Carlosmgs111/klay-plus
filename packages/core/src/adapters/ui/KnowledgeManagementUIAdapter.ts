import type { KnowledgeManagementPort } from "../../application/knowledge-management/contracts/KnowledgeManagementPort";
import type {
  IngestAndAddSourceInput,
  IngestAndAddSourceSuccess,
} from "../../application/knowledge-management/contracts/dtos";
import type { UIResult } from "./KnowledgePipelineUIAdapter";

/**
 * KnowledgeManagementUIAdapter — Primary Adapter for UI consumers.
 *
 * Wraps the KnowledgeManagementPort, converting Result<E, T> into
 * UIResult<T> for simpler consumption by frontend components.
 *
 * This adapter:
 * - Receives KnowledgeManagementPort (never the implementation)
 * - Only transforms Result → UIResult
 */
export class KnowledgeManagementUIAdapter {
  constructor(private readonly _management: KnowledgeManagementPort) {}

  async ingestAndAddSource(input: IngestAndAddSourceInput): Promise<UIResult<IngestAndAddSourceSuccess>> {
    const result = await this._management.ingestAndAddSource(input);
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
