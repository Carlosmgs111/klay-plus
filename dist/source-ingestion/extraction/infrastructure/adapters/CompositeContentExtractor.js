/**
 * Composite content extractor that delegates to specialized extractors
 * based on MIME type.
 *
 * This allows registering multiple extractors and automatically routing
 * extraction requests to the appropriate handler.
 */
export class CompositeContentExtractor {
    extractors = [];
    /**
     * Registers an extractor to handle specific MIME types.
     */
    register(extractor) {
        this.extractors.push(extractor);
        return this;
    }
    canExtract(mimeType) {
        return this.extractors.some((e) => e.canExtract(mimeType));
    }
    async extract(source) {
        const extractor = this.extractors.find((e) => e.canExtract(source.mimeType));
        if (!extractor) {
            throw new Error(`No extractor found for MIME type: ${source.mimeType}`);
        }
        return extractor.extract(source);
    }
    /**
     * Returns the list of all supported MIME types.
     */
    getSupportedMimeTypes() {
        const commonMimeTypes = [
            "text/plain",
            "text/markdown",
            "text/csv",
            "application/json",
            "application/pdf",
        ];
        return commonMimeTypes.filter((mime) => this.canExtract(mime));
    }
}
//# sourceMappingURL=CompositeContentExtractor.js.map