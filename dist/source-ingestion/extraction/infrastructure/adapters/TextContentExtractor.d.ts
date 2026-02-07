import type { ContentExtractor, ExtractionResult } from "../../domain/ContentExtractor.js";
/**
 * Extracts raw text from plain text, markdown, CSV, and JSON sources.
 * Browser + Node.js compatible.
 *
 * For in-memory sources, provide the content directly via the `content` property.
 * For URI-based sources, the extractor will attempt to fetch the content.
 */
export declare class TextContentExtractor implements ContentExtractor {
    canExtract(mimeType: string): boolean;
    extract(source: {
        uri: string;
        content?: ArrayBuffer;
        mimeType: string;
    }): Promise<ExtractionResult>;
    private computeHash;
    private extractMetadata;
}
//# sourceMappingURL=TextContentExtractor.d.ts.map