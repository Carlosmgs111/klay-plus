import { ExtractionJob } from "../domain/ExtractionJob.js";
import { ExtractionJobId } from "../domain/ExtractionJobId.js";
/**
 * Error thrown when no extractor is available for a given MIME type.
 */
export class UnsupportedMimeTypeError extends Error {
    mimeType;
    supportedTypes;
    constructor(mimeType, supportedTypes) {
        super(`No extractor available for MIME type: ${mimeType}. ` +
            `Supported types: ${supportedTypes.join(", ")}`);
        this.mimeType = mimeType;
        this.supportedTypes = supportedTypes;
        this.name = "UnsupportedMimeTypeError";
    }
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
export class ExecuteExtraction {
    jobRepository;
    extractors;
    eventPublisher;
    constructor(jobRepository, extractors, eventPublisher) {
        this.jobRepository = jobRepository;
        this.extractors = extractors;
        this.eventPublisher = eventPublisher;
    }
    /**
     * Returns the list of supported MIME types.
     */
    getSupportedMimeTypes() {
        return Array.from(this.extractors.keys());
    }
    async execute(command) {
        const jobId = ExtractionJobId.create(command.jobId);
        const job = ExtractionJob.create(jobId, command.sourceId);
        // Select extractor based on mimeType
        const extractor = this.extractors.get(command.mimeType);
        if (!extractor) {
            throw new UnsupportedMimeTypeError(command.mimeType, this.getSupportedMimeTypes());
        }
        job.start();
        try {
            const result = await extractor.extract({
                uri: command.uri,
                content: command.content,
                mimeType: command.mimeType,
            });
            job.complete(result);
            await this.jobRepository.save(job);
            await this.eventPublisher.publishAll(job.clearEvents());
            return {
                jobId: command.jobId,
                contentHash: result.contentHash,
                extractedText: result.text,
                metadata: result.metadata,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            job.fail(message);
            await this.jobRepository.save(job);
            await this.eventPublisher.publishAll(job.clearEvents());
            throw error;
        }
    }
}
//# sourceMappingURL=ExecuteExtraction.js.map