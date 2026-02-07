/**
 * PDF Content Extractor that works in both browser and server environments.
 *
 * - Browser: Uses pdfjs-dist
 * - Server: Uses pdf-extraction (Node.js)
 *
 * The environment is detected automatically based on available APIs.
 */
export class PdfContentExtractor {
    static PDF_MIME_TYPE = "application/pdf";
    canExtract(mimeType) {
        return mimeType === PdfContentExtractor.PDF_MIME_TYPE;
    }
    async extract(source) {
        if (!this.canExtract(source.mimeType)) {
            throw new Error(`PdfContentExtractor only supports ${PdfContentExtractor.PDF_MIME_TYPE}`);
        }
        const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
        if (isBrowser) {
            return this.extractBrowser(source);
        }
        return this.extractServer(source);
    }
    async extractBrowser(source) {
        const pdfjs = await import("pdfjs-dist");
        const pdfSource = source.content
            ? { data: new Uint8Array(source.content) }
            : source.uri;
        const loadingTask = pdfjs.getDocument(pdfSource);
        const pdf = await loadingTask.promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item) => ("str" in item ? item.str : ""))
                .join(" ");
            pages.push(pageText);
        }
        const text = pages.join("\n\n");
        const contentHash = await this.computeHashBrowser(text);
        return {
            text,
            contentHash,
            metadata: {
                mimeType: PdfContentExtractor.PDF_MIME_TYPE,
                pageCount: pdf.numPages,
                characterCount: text.length,
                extractor: "pdfjs-dist",
            },
        };
    }
    async extractServer(source) {
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
        const contentHash = await this.computeHashServer(text);
        return {
            text,
            contentHash,
            metadata: {
                mimeType: PdfContentExtractor.PDF_MIME_TYPE,
                pageCount,
                characterCount: text.length,
                extractor: "pdf-extraction",
            },
        };
    }
    async computeHashBrowser(content) {
        const data = new TextEncoder().encode(content);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    async computeHashServer(content) {
        const crypto = await import("crypto");
        return crypto.createHash("sha256").update(content).digest("hex");
    }
}
//# sourceMappingURL=PdfContentExtractor.js.map