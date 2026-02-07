/**
 * Result of a content extraction operation.
 */
export interface ExtractionResult {
  /** The extracted text content */
  text: string;
  /** Hash of the extracted content for change detection */
  contentHash: string;
  /** Additional metadata extracted from the content */
  metadata: Record<string, unknown>;
}

/**
 * Contract for content extractors.
 *
 * Extractors are responsible for extracting text content from various
 * source formats (PDF, DOCX, plain text, etc.). They are format-agnostic
 * at the domain level - implementations handle specific formats.
 */
export interface ContentExtractor {
  /**
   * Checks if this extractor can handle the given MIME type.
   * @param mimeType - The MIME type of the content (e.g., "application/pdf")
   */
  canExtract(mimeType: string): boolean;

  /**
   * Extracts text content from the given source.
   * @param source - The source to extract from
   * @param source.uri - URI or path to the content
   * @param source.content - Optional raw content buffer (for in-memory sources)
   * @param source.mimeType - MIME type of the content
   * @returns The extraction result with text, hash, and metadata
   */
  extract(source: {
    uri: string;
    content?: ArrayBuffer;
    mimeType: string;
  }): Promise<ExtractionResult>;
}
