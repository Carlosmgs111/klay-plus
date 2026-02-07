import type { SourceUseCases } from "../../source/application/index.js";
import type { ExtractionUseCases } from "../../extraction/application/index.js";
import type { SourceType } from "../../source/domain/SourceType.js";
import type { ResolvedSourceIngestionModules } from "./composition/infra-policies.js";
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
export declare class SourceIngestionFacade {
    private readonly _source;
    private readonly _extraction;
    private readonly _sourceRepository;
    constructor(modules: ResolvedSourceIngestionModules);
    get source(): SourceUseCases;
    get extraction(): ExtractionUseCases;
    /**
     * Registers a source (stores reference only, no extraction).
     */
    registerSource(params: {
        id: string;
        name: string;
        uri: string;
        type: SourceType;
    }): Promise<{
        sourceId: string;
    }>;
    /**
     * Executes extraction for a registered source.
     * Coordinates the full flow:
     * 1. Fetches source from repository
     * 2. Executes extraction (pure, no source dependency)
     * 3. Updates source with content hash
     */
    extractSource(params: {
        jobId: string;
        sourceId: string;
    }): Promise<{
        jobId: string;
        contentHash: string;
        changed: boolean;
    }>;
    /**
     * Registers a source and immediately executes extraction.
     * This is the complete ingestion workflow.
     */
    ingestAndExtract(params: {
        sourceId: string;
        sourceName: string;
        uri: string;
        type: SourceType;
        extractionJobId: string;
    }): Promise<{
        sourceId: string;
        jobId: string;
        contentHash: string;
    }>;
    /**
     * Batch registration of multiple sources (no extraction).
     */
    batchRegister(sources: Array<{
        id: string;
        name: string;
        uri: string;
        type: SourceType;
    }>): Promise<Array<{
        sourceId: string;
        success: boolean;
        error?: string;
    }>>;
    /**
     * Batch ingestion with extraction.
     */
    batchIngestAndExtract(sources: Array<{
        sourceId: string;
        sourceName: string;
        uri: string;
        type: SourceType;
        extractionJobId: string;
    }>): Promise<Array<{
        sourceId: string;
        jobId: string;
        success: boolean;
        contentHash?: string;
        error?: string;
    }>>;
}
//# sourceMappingURL=SourceIngestionFacade.d.ts.map