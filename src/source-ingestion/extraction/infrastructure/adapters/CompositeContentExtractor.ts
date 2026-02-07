import type { ContentExtractor, ExtractionResult } from "../../domain/ContentExtractor.js";

/**
 * Composite content extractor that delegates to specialized extractors
 * based on MIME type.
 *
 * This allows registering multiple extractors and automatically routing
 * extraction requests to the appropriate handler.
 */
export class CompositeContentExtractor implements ContentExtractor {
  private readonly extractors: ContentExtractor[] = [];

  /**
   * Registers an extractor to handle specific MIME types.
   */
  register(extractor: ContentExtractor): this {
    this.extractors.push(extractor);
    return this;
  }

  canExtract(mimeType: string): boolean {
    return this.extractors.some((e) => e.canExtract(mimeType));
  }

  async extract(source: {
    uri: string;
    content?: ArrayBuffer;
    mimeType: string;
  }): Promise<ExtractionResult> {
    const extractor = this.extractors.find((e) => e.canExtract(source.mimeType));

    if (!extractor) {
      throw new Error(`No extractor found for MIME type: ${source.mimeType}`);
    }

    return extractor.extract(source);
  }

  /**
   * Returns the list of all supported MIME types.
   */
  getSupportedMimeTypes(): string[] {
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
