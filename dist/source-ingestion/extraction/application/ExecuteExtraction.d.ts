import type { EventPublisher } from "../../../shared/domain/index.js";
import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository.js";
import type { ContentExtractor } from "../domain/ContentExtractor.js";
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
 * Use case for executing content extraction.
 *
 * This use case is pure: it receives the URI and mimeType directly,
 * performs extraction, and stores the result in an ExtractionJob.
 * It does NOT interact with Source - that coordination is done by the orchestrator.
 */
export declare class ExecuteExtraction {
    private readonly jobRepository;
    private readonly extractor;
    private readonly eventPublisher;
    constructor(jobRepository: ExtractionJobRepository, extractor: ContentExtractor, eventPublisher: EventPublisher);
    execute(command: ExecuteExtractionCommand): Promise<ExecuteExtractionResult>;
}
//# sourceMappingURL=ExecuteExtraction.d.ts.map