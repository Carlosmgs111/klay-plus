import type { EventPublisher } from "../../../shared/domain/index.js";
import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository.js";
import type { ContentExtractor } from "../domain/ContentExtractor.js";
/**
 * Map of MIME types to their corresponding content extractors.
 */
export type ExtractorMap = Map<string, ContentExtractor>;
export interface ExecuteExtractionCommand {
    jobId: string;
    sourceId: string;
    uri: string;
    mimeType: string;
    content?: ArrayBuffer;
}
export interface ExecuteExtractionResult {
    jobId: string;
    contentHash: string;
    extractedText: string;
    metadata: Record<string, unknown>;
}
/**
 * Error thrown when no extractor is available for a given MIME type.
 */
export declare class UnsupportedMimeTypeError extends Error {
    readonly mimeType: string;
    readonly supportedTypes: string[];
    constructor(mimeType: string, supportedTypes: string[]);
}
/**
 * Use case for executing content extraction.
 *
 * This use case is pure: it receives the URI and mimeType directly,
 * selects the appropriate extractor, performs extraction, and stores
 * the result in an ExtractionJob.
 *
 * It does NOT interact with Source - that coordination is done by the facade.
 */
export declare class ExecuteExtraction {
    private readonly jobRepository;
    private readonly extractors;
    private readonly eventPublisher;
    constructor(jobRepository: ExtractionJobRepository, extractors: ExtractorMap, eventPublisher: EventPublisher);
    /**
     * Returns the list of supported MIME types.
     */
    getSupportedMimeTypes(): string[];
    execute(command: ExecuteExtractionCommand): Promise<ExecuteExtractionResult>;
}
//# sourceMappingURL=ExecuteExtraction.d.ts.map