/**
 * PDF Content Extractor for server/Node.js environments.
 * Uses pdf-extraction for server-side PDF parsing.
 */
export class ServerPdfContentExtractor {
    static PDF_MIME_TYPE = "application/pdf";
    canExtract(mimeType) {
        return mimeType === ServerPdfContentExtractor.PDF_MIME_TYPE;
    }
    async extract(source) {
        if (!this.canExtract(source.mimeType)) {
            throw new Error(`ServerPdfContentExtractor only supports ${ServerPdfContentExtractor.PDF_MIME_TYPE}`);
        }
        const pdfExtraction = await import("pdf-extraction");
        let dataBuffer;
        if (source.content) {
            dataBuffer = Buffer.from(source.content);
        }
        else {
            const fs = await import("fs");
            dataBuffer = fs.readFileSync(source.uri);
        }
        const data = await pdfExtraction.default(dataBuffer);
        const text = data.text || "";
        const pageCount = data.numpages || 0;
        const contentHash = await this.computeHash(text);
        return {
            text,
            contentHash,
            metadata: {
                mimeType: ServerPdfContentExtractor.PDF_MIME_TYPE,
                pageCount,
                characterCount: text.length,
                extractor: "pdf-extraction",
            },
        };
    }
    async computeHash(content) {
        const crypto = await import("crypto");
        return crypto.createHash("sha256").update(content).digest("hex");
    }
}
//# sourceMappingURL=ServerPdfContentExtractor.js.map