import { SourceType as SourceTypeEnum } from "../../source/domain/SourceType.js";
import { SourceId } from "../../source/domain/SourceId.js";
// ─── SourceType to MIME Type Mapping ─────────────────────────────────────────
const SOURCE_TYPE_TO_MIME = {
    [SourceTypeEnum.Pdf]: "application/pdf",
    [SourceTypeEnum.Web]: "text/html",
    [SourceTypeEnum.Api]: "application/json",
    [SourceTypeEnum.PlainText]: "text/plain",
    [SourceTypeEnum.Markdown]: "text/markdown",
    [SourceTypeEnum.Csv]: "text/csv",
    [SourceTypeEnum.Json]: "application/json",
};
// ─── Facade ──────────────────────────────────────────────────────────────────
/**
 * Application Facade for the Source Ingestion bounded context.
 *
 * Provides a unified entry point to all modules within the context,
 * coordinating use cases for source registration and content extraction.
 *
 * This is an Application Layer component - it does NOT contain domain logic.
 * It only coordinates existing use cases and handles cross-module workflows.
 *
 * The facade coordinates the flow:
 * 1. Source registration (stores reference only)
 * 2. Content extraction (extracts text from URI)
 * 3. Source update (records extraction hash)
 */
export class SourceIngestionFacade {
    _source;
    _extraction;
    _sourceRepository;
    constructor(modules) {
        this._source = modules.source;
        this._extraction = modules.extraction;
        this._sourceRepository = modules.sourceRepository;
    }
    // ─── Module Accessors ──────────────────────────────────────────────────────
    get source() {
        return this._source;
    }
    get extraction() {
        return this._extraction;
    }
    // ─── Workflow Operations ───────────────────────────────────────────────────
    /**
     * Registers a source (stores reference only, no extraction).
     */
    async registerSource(params) {
        await this._source.registerSource.execute({
            id: params.id,
            name: params.name,
            type: params.type,
            uri: params.uri,
        });
        return { sourceId: params.id };
    }
    /**
     * Executes extraction for a registered source.
     * Coordinates the full flow:
     * 1. Fetches source from repository
     * 2. Executes extraction (pure, no source dependency)
     * 3. Updates source with content hash
     */
    async extractSource(params) {
        // 1. Fetch source from repository
        const sourceId = SourceId.create(params.sourceId);
        const source = await this._sourceRepository.findById(sourceId);
        if (!source) {
            throw new Error(`Source ${params.sourceId} not found`);
        }
        // 2. Execute extraction with URI and mimeType
        const mimeType = SOURCE_TYPE_TO_MIME[source.type];
        const result = await this._extraction.executeExtraction.execute({
            jobId: params.jobId,
            sourceId: params.sourceId,
            uri: source.uri,
            mimeType,
        });
        // 3. Update source with content hash
        const changed = await this._source.updateSource.execute({
            sourceId: params.sourceId,
            contentHash: result.contentHash,
        });
        return {
            jobId: params.jobId,
            contentHash: result.contentHash,
            changed,
        };
    }
    /**
     * Registers a source and immediately executes extraction.
     * This is the complete ingestion workflow.
     */
    async ingestAndExtract(params) {
        // Register source
        await this.registerSource({
            id: params.sourceId,
            name: params.sourceName,
            uri: params.uri,
            type: params.type,
        });
        // Execute extraction
        const extractionResult = await this.extractSource({
            jobId: params.extractionJobId,
            sourceId: params.sourceId,
        });
        return {
            sourceId: params.sourceId,
            jobId: params.extractionJobId,
            contentHash: extractionResult.contentHash,
        };
    }
    /**
     * Batch registration of multiple sources (no extraction).
     */
    async batchRegister(sources) {
        const results = await Promise.allSettled(sources.map((source) => this.registerSource(source)));
        return results.map((result, index) => {
            if (result.status === "fulfilled") {
                return {
                    sourceId: result.value.sourceId,
                    success: true,
                };
            }
            return {
                sourceId: sources[index].id,
                success: false,
                error: result.reason instanceof Error ? result.reason.message : String(result.reason),
            };
        });
    }
    /**
     * Batch ingestion with extraction.
     */
    async batchIngestAndExtract(sources) {
        const results = await Promise.allSettled(sources.map((source) => this.ingestAndExtract(source)));
        return results.map((result, index) => {
            if (result.status === "fulfilled") {
                return {
                    sourceId: result.value.sourceId,
                    jobId: result.value.jobId,
                    success: true,
                    contentHash: result.value.contentHash,
                };
            }
            return {
                sourceId: sources[index].sourceId,
                jobId: sources[index].extractionJobId,
                success: false,
                error: result.reason instanceof Error ? result.reason.message : String(result.reason),
            };
        });
    }
}
//# sourceMappingURL=SourceIngestionFacade.js.map