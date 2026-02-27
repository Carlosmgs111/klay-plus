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
  GetManifestInput,
  GetManifestSuccess,
} from "../../application/knowledge-pipeline/contracts/dtos";

/**
 * Generic result type for UI consumption.
 * Unwraps the Result<E, T> pattern into a simpler success/error shape.
 */
export type UIResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        message: string;
        code: string;
        step?: string;
        completedSteps?: string[];
      };
    };

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
    return this._unwrap(result);
  }

  async ingestDocument(input: IngestDocumentInput): Promise<UIResult<IngestDocumentSuccess>> {
    const result = await this._pipeline.ingestDocument(input);
    return this._unwrap(result);
  }

  async processDocument(input: ProcessDocumentInput): Promise<UIResult<ProcessDocumentSuccess>> {
    const result = await this._pipeline.processDocument(input);
    return this._unwrap(result);
  }

  async catalogDocument(input: CatalogDocumentInput): Promise<UIResult<CatalogDocumentSuccess>> {
    const result = await this._pipeline.catalogDocument(input);
    return this._unwrap(result);
  }

  async searchKnowledge(input: SearchKnowledgeInput): Promise<UIResult<SearchKnowledgeSuccess>> {
    const result = await this._pipeline.searchKnowledge(input);
    return this._unwrap(result);
  }

  async createProcessingProfile(input: CreateProcessingProfileInput): Promise<UIResult<CreateProcessingProfileSuccess>> {
    const result = await this._pipeline.createProcessingProfile(input);
    return this._unwrap(result);
  }

  async getManifest(input: GetManifestInput): Promise<UIResult<GetManifestSuccess>> {
    const result = await this._pipeline.getManifest(input);
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
