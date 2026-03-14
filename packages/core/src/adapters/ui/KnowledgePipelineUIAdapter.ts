import type { KnowledgePipelinePort } from "../../application/knowledge-pipeline/contracts/KnowledgePipelinePort";
import type {
  ExecutePipelineInput,
  ExecutePipelineSuccess,
  IngestDocumentInput,
  IngestDocumentSuccess,
  ProcessDocumentInput,
  ProcessDocumentSuccess,
  CatalogDocumentInput,
  CatalogDocumentSuccess,
  SearchKnowledgeInput,
  SearchKnowledgeSuccess,
  CreateProcessingProfileInput,
  CreateProcessingProfileSuccess,
  ListProfilesResult,
  UpdateProfileInput,
  UpdateProfileResult,
  DeprecateProfileInput,
  DeprecateProfileResult,
  GetManifestInput,
  GetManifestSuccess,
} from "../../application/knowledge-pipeline/contracts/dtos";
import { unwrapResult } from "../shared/resultTransformers";
import type { UIResult } from "../shared/resultTransformers";

/**
 * KnowledgePipelineUIAdapter — Primary Adapter for UI consumers.
 *
 * Wraps the KnowledgePipelinePort, converting Result<E, T> into
 * UIResult<T> for simpler consumption by frontend components.
 *
 * This adapter:
 * - Receives KnowledgePipelinePort (never the implementation)
 * - Only transforms Result → UIResult
 */
export class KnowledgePipelineUIAdapter {
  constructor(private readonly _pipeline: KnowledgePipelinePort) {}

  async execute(input: ExecutePipelineInput): Promise<UIResult<ExecutePipelineSuccess>> {
    const result = await this._pipeline.execute(input);
    return unwrapResult(result);
  }

  async ingestDocument(input: IngestDocumentInput): Promise<UIResult<IngestDocumentSuccess>> {
    const result = await this._pipeline.ingestDocument(input);
    return unwrapResult(result);
  }

  async processDocument(input: ProcessDocumentInput): Promise<UIResult<ProcessDocumentSuccess>> {
    const result = await this._pipeline.processDocument(input);
    return unwrapResult(result);
  }

  async catalogDocument(input: CatalogDocumentInput): Promise<UIResult<CatalogDocumentSuccess>> {
    const result = await this._pipeline.catalogDocument(input);
    return unwrapResult(result);
  }

  async searchKnowledge(input: SearchKnowledgeInput): Promise<UIResult<SearchKnowledgeSuccess>> {
    const result = await this._pipeline.searchKnowledge(input);
    return unwrapResult(result);
  }

  async createProcessingProfile(input: CreateProcessingProfileInput): Promise<UIResult<CreateProcessingProfileSuccess>> {
    const result = await this._pipeline.createProcessingProfile(input);
    return unwrapResult(result);
  }

  async listProfiles(): Promise<UIResult<ListProfilesResult>> {
    const result = await this._pipeline.listProfiles();
    return unwrapResult(result);
  }

  async updateProfile(input: UpdateProfileInput): Promise<UIResult<UpdateProfileResult>> {
    const result = await this._pipeline.updateProfile(input);
    return unwrapResult(result);
  }

  async deprecateProfile(input: DeprecateProfileInput): Promise<UIResult<DeprecateProfileResult>> {
    const result = await this._pipeline.deprecateProfile(input);
    return unwrapResult(result);
  }

  async getManifest(input: GetManifestInput): Promise<UIResult<GetManifestSuccess>> {
    const result = await this._pipeline.getManifest(input);
    return unwrapResult(result);
  }
}
