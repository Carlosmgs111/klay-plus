import type { KnowledgeManagementPort } from "../../application/knowledge-management/contracts/KnowledgeManagementPort";
import type { IngestAndAddSourceInput } from "../../application/knowledge-management/contracts/dtos";
import { toRESTResponse } from "../shared/resultTransformers";
import type { RESTRequest, RESTResponse } from "../shared/resultTransformers";

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
    return toRESTResponse(result);
  }
}
