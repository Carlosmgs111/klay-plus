import type { KnowledgeManagementPort } from "../../application/knowledge-management/contracts/KnowledgeManagementPort.js";
import type { IngestAndAddSourceInput } from "../../application/knowledge-management/contracts/dtos.js";
import type { RESTRequest, RESTResponse } from "./KnowledgePipelineRESTAdapter.js";

/**
 * KnowledgeManagementRESTAdapter — Primary Adapter for REST consumers.
 *
 * Wraps the KnowledgeManagementPort, converting REST request/response
 * into port-level DTOs and Result types.
 *
 * This adapter:
 * - Receives KnowledgeManagementPort (never the implementation)
 * - Only transforms Request → DTO and Result → Response
 * - Is framework-agnostic (Express, Hono, Astro, etc.)
 */
export class KnowledgeManagementRESTAdapter {
  constructor(private readonly _management: KnowledgeManagementPort) {}

  async ingestAndAddSource(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as IngestAndAddSourceInput;
    const result = await this._management.ingestAndAddSource(input);
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
