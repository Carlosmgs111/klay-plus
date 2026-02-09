import type { ContentExtractor, ExtractionResult } from "../../domain/ContentExtractor.js";
/**
 * PDF Content Extractor for browser environments.
 * Uses pdfjs-dist for client-side PDF parsing.
 */
export declare class BrowserPdfContentExtractor implements ContentExtractor {
    private static readonly PDF_MIME_TYPE;
    canExtract(mimeType: string): boolean;
    extract(source: {
        uri: string;
        content?: ArrayBuffer;
        mimeType: string;
    }): Promise<ExtractionResult>;
    private computeHash;
}
//# sourceMappingURL=BrowserPdfContentExtractor.d.ts.map