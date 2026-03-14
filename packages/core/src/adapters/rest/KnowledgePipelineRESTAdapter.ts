import type { KnowledgePipelinePort } from "../../application/knowledge-pipeline/contracts/KnowledgePipelinePort";
import type {
  ExecutePipelineInput,
  IngestDocumentInput,
  ProcessDocumentInput,
  CatalogDocumentInput,
  SearchKnowledgeInput,
  CreateProcessingProfileInput,
  UpdateProfileInput,
  DeprecateProfileInput,
  GetManifestInput,
} from "../../application/knowledge-pipeline/contracts/dtos";
import { toRESTResponse } from "../shared/resultTransformers";
import type { RESTRequest, RESTResponse } from "../shared/resultTransformers";

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
    return toRESTResponse(result);
  }

  async ingestDocument(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as IngestDocumentInput;
    const result = await this._pipeline.ingestDocument(input);
    return toRESTResponse(result);
  }

  async processDocument(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as ProcessDocumentInput;
    const result = await this._pipeline.processDocument(input);
    return toRESTResponse(result);
  }

  async catalogDocument(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as CatalogDocumentInput;
    const result = await this._pipeline.catalogDocument(input);
    return toRESTResponse(result);
  }

  async searchKnowledge(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as SearchKnowledgeInput;
    const result = await this._pipeline.searchKnowledge(input);
    return toRESTResponse(result);
  }

  async createProcessingProfile(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as CreateProcessingProfileInput;
    const result = await this._pipeline.createProcessingProfile(input);
    return toRESTResponse(result);
  }

  async listProfiles(_req: RESTRequest): Promise<RESTResponse> {
    const result = await this._pipeline.listProfiles();
    return toRESTResponse(result);
  }

  async updateProfile(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as UpdateProfileInput;
    const result = await this._pipeline.updateProfile(input);
    return toRESTResponse(result);
  }

  async deprecateProfile(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as DeprecateProfileInput;
    const result = await this._pipeline.deprecateProfile(input);
    return toRESTResponse(result);
  }

  async getManifest(req: RESTRequest): Promise<RESTResponse> {
    const input: GetManifestInput = {
      resourceId: req.query?.resourceId ?? (req.body as any)?.resourceId,
      sourceId: req.query?.sourceId ?? (req.body as any)?.sourceId,
      manifestId: req.params?.manifestId ?? req.query?.manifestId ?? (req.body as any)?.manifestId,
      contextId: req.query?.contextId ?? (req.body as any)?.contextId,
    };
    const result = await this._pipeline.getManifest(input);
    return toRESTResponse(result);
  }
}
