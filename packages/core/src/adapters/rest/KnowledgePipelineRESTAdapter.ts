import type { KnowledgePipelinePort } from "../../application/knowledge-pipeline/contracts/KnowledgePipelinePort.js";
import type {
  ExecutePipelineInput,
  IngestDocumentInput,
  ProcessDocumentInput,
  CatalogDocumentInput,
  SearchKnowledgeInput,
  CreateProcessingProfileInput,
  GetManifestInput,
  AddSourceInput,
  RemoveSourceInput,
  ReprocessUnitInput,
  RollbackUnitInput,
  AddProjectionInput,
  LinkUnitsInput,
} from "../../application/knowledge-pipeline/contracts/dtos.js";

// ─── REST Types ─────────────────────────────────────────────────────────────

/**
 * Framework-agnostic request representation.
 * Adapters for specific frameworks (Express, Hono, Astro, etc.)
 * can convert their native request to this shape.
 */
export interface RESTRequest {
  body: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

/**
 * Framework-agnostic response representation.
 */
export interface RESTResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

// ─── REST Adapter ───────────────────────────────────────────────────────────

/**
 * KnowledgePipelineRESTAdapter — Primary Adapter for REST consumers.
 *
 * Wraps the KnowledgePipelinePort, converting REST request/response
 * into port-level DTOs and Result types.
 *
 * This adapter:
 * - Receives KnowledgePipelinePort (never the implementation)
 * - Contains zero business logic
 * - Only transforms Request → DTO and Result → Response
 * - Is framework-agnostic (Express, Hono, Astro, etc.)
 */
export class KnowledgePipelineRESTAdapter {
  constructor(private readonly _pipeline: KnowledgePipelinePort) {}

  async execute(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as ExecutePipelineInput;
    const result = await this._pipeline.execute(input);
    return this._toResponse(result);
  }

  async ingestDocument(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as IngestDocumentInput;
    const result = await this._pipeline.ingestDocument(input);
    return this._toResponse(result);
  }

  async processDocument(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as ProcessDocumentInput;
    const result = await this._pipeline.processDocument(input);
    return this._toResponse(result);
  }

  async catalogDocument(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as CatalogDocumentInput;
    const result = await this._pipeline.catalogDocument(input);
    return this._toResponse(result);
  }

  async searchKnowledge(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as SearchKnowledgeInput;
    const result = await this._pipeline.searchKnowledge(input);
    return this._toResponse(result);
  }

  async createProcessingProfile(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as CreateProcessingProfileInput;
    const result = await this._pipeline.createProcessingProfile(input);
    return this._toResponse(result);
  }

  async getManifest(req: RESTRequest): Promise<RESTResponse> {
    const input: GetManifestInput = {
      resourceId: req.query?.resourceId ?? (req.body as any)?.resourceId,
      sourceId: req.query?.sourceId ?? (req.body as any)?.sourceId,
      manifestId: req.params?.manifestId ?? req.query?.manifestId ?? (req.body as any)?.manifestId,
    };
    const result = await this._pipeline.getManifest(input);
    return this._toResponse(result);
  }

  async addSource(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as AddSourceInput;
    const result = await this._pipeline.addSource(input);
    return this._toResponse(result);
  }

  async removeSource(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as RemoveSourceInput;
    const result = await this._pipeline.removeSource(input);
    return this._toResponse(result);
  }

  async reprocessUnit(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as ReprocessUnitInput;
    const result = await this._pipeline.reprocessUnit(input);
    return this._toResponse(result);
  }

  async rollbackUnit(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as RollbackUnitInput;
    const result = await this._pipeline.rollbackUnit(input);
    return this._toResponse(result);
  }

  async addProjection(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as AddProjectionInput;
    const result = await this._pipeline.addProjection(input);
    return this._toResponse(result);
  }

  async linkUnits(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as LinkUnitsInput;
    const result = await this._pipeline.linkUnits(input);
    return this._toResponse(result);
  }

  // ─── Private ────────────────────────────────────────────────────────────────

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
