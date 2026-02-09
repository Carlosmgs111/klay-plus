import type { ContentExtractor, ExtractionResult } from "../../domain/ContentExtractor.js";
/**
 * PDF Content Extractor for server/Node.js environments.
 * Uses pdf-extraction for server-side PDF parsing.
 */
export declare class ServerPdfContentExtractor implements ContentExtractor {
    private static readonly PDF_MIME_TYPE;
    canExtract(mimeType: string): boolean;
    extract(source: {
        uri: string;
        content?: ArrayBuffer;
        mimeType: string;
    }): Promise<ExtractionResult>;
    private computeHash;
}
//# sourceMappingURL=ServerPdfContentExtractor.d.ts.map