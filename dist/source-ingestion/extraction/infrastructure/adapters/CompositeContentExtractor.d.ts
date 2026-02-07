import type { ContentExtractor, ExtractionResult } from "../../domain/ContentExtractor.js";
/**
 * Composite content extractor that delegates to specialized extractors
 * based on MIME type.
 *
 * This allows registering multiple extractors and automatically routing
 * extraction requests to the appropriate handler.
 */
export declare class CompositeContentExtractor implements ContentExtractor {
    private readonly extractors;
    /**
     * Registers an extractor to handle specific MIME types.
     */
    register(extractor: ContentExtractor): this;
    canExtract(mimeType: string): boolean;
    extract(source: {
        uri: string;
        content?: ArrayBuffer;
        mimeType: string;
    }): Promise<ExtractionResult>;
    /**
     * Returns the list of all supported MIME types.
     */
    getSupportedMimeTypes(): string[];
}
//# sourceMappingURL=CompositeContentExtractor.d.ts.map