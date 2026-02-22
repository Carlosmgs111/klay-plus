import type { PipelineService } from "./pipeline-service.js";
import type { ServiceResult } from "./types.js";
import type { KnowledgePipelineUIAdapter, UIResult } from "@klay/core/adapters/ui";
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
} from "@klay/core";

/**
 * BrowserPipelineService — runs the pipeline entirely in the browser.
 *
 * Uses dynamic imports to lazily load @klay/core and create a pipeline
 * with IndexedDB storage and hash embeddings.
 */
export class BrowserPipelineService implements PipelineService {
  private _adapterPromise: Promise<KnowledgePipelineUIAdapter> | null = null;

  private _getAdapter(): Promise<KnowledgePipelineUIAdapter> {
    if (!this._adapterPromise) {
      this._adapterPromise = this._initAdapter();
    }
    return this._adapterPromise;
  }

  private async _initAdapter(): Promise<KnowledgePipelineUIAdapter> {
    const [{ createKnowledgePipeline }, { KnowledgePipelineUIAdapter }] =
      await Promise.all([
        import("@klay/core"),
        import("@klay/core/adapters/ui"),
      ]);

    const pipeline = await createKnowledgePipeline({
      provider: "browser",
      dbName: "klay-dashboard",
      embeddingDimensions: 128,
    });

    // Seed default processing profile (ignore if already exists)
    await pipeline.createProcessingProfile({
      id: "default",
      name: "Default",
      chunkingStrategyId: "recursive",
      embeddingStrategyId: "hash",
    });

    return new KnowledgePipelineUIAdapter(pipeline);
  }

  async execute(
    input: ExecutePipelineInput,
  ): Promise<ServiceResult<ExecutePipelineSuccess>> {
    const adapter = await this._getAdapter();
    return adapter.execute(input) as Promise<ServiceResult<ExecutePipelineSuccess>>;
  }

  async ingestDocument(
    input: IngestDocumentInput,
  ): Promise<ServiceResult<IngestDocumentSuccess>> {
    const adapter = await this._getAdapter();
    return adapter.ingestDocument(input) as Promise<ServiceResult<IngestDocumentSuccess>>;
  }

  async processDocument(
    input: ProcessDocumentInput,
  ): Promise<ServiceResult<ProcessDocumentSuccess>> {
    const adapter = await this._getAdapter();
    return adapter.processDocument(input) as Promise<ServiceResult<ProcessDocumentSuccess>>;
  }

  async catalogDocument(
    input: CatalogDocumentInput,
  ): Promise<ServiceResult<CatalogDocumentSuccess>> {
    const adapter = await this._getAdapter();
    return adapter.catalogDocument(input) as Promise<ServiceResult<CatalogDocumentSuccess>>;
  }

  async searchKnowledge(
    input: SearchKnowledgeInput,
  ): Promise<ServiceResult<SearchKnowledgeSuccess>> {
    const adapter = await this._getAdapter();
    return adapter.searchKnowledge(input) as Promise<ServiceResult<SearchKnowledgeSuccess>>;
  }

  async createProcessingProfile(
    input: CreateProcessingProfileInput,
  ): Promise<ServiceResult<CreateProcessingProfileSuccess>> {
    const adapter = await this._getAdapter();
    return adapter.createProcessingProfile(input) as Promise<
      ServiceResult<CreateProcessingProfileSuccess>
    >;
  }

  async getManifest(
    input: GetManifestInput,
  ): Promise<ServiceResult<GetManifestSuccess>> {
    const adapter = await this._getAdapter();
    return adapter.getManifest(input) as Promise<ServiceResult<GetManifestSuccess>>;
  }
}
