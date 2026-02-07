import type { ContentExtractor, ExtractionResult } from "../../domain/ContentExtractor.js";
/**
 * PDF Content Extractor that works in both browser and server environments.
 *
 * - Browser: Uses pdfjs-dist
 * - Server: Uses pdf-extraction (Node.js)
 *
 * The environment is detected automatically based on available APIs.
 */
export declare class PdfContentExtractor implements ContentExtractor {
    private static readonly PDF_MIME_TYPE;
    canExtract(mimeType: string): boolean;
    extract(source: {
        uri: string;
        content?: ArrayBuffer;
        mimeType: string;
    }): Promise<ExtractionResult>;
    private extractBrowser;
    private extractServer;
    private computeHashBrowser;
    private computeHashServer;
}
//# sourceMappingURL=PdfContentExtractor.d.ts.map