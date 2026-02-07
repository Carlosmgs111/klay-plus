import type { ContentExtractor, ExtractionResult } from "../../domain/ContentExtractor.js";

/**
 * PDF Content Extractor that works in both browser and server environments.
 *
 * - Browser: Uses pdfjs-dist
 * - Server: Uses pdf-extraction (Node.js)
 *
 * The environment is detected automatically based on available APIs.
 */
export class PdfContentExtractor implements ContentExtractor {
  private static readonly PDF_MIME_TYPE = "application/pdf";

  canExtract(mimeType: string): boolean {
    return mimeType === PdfContentExtractor.PDF_MIME_TYPE;
  }

  async extract(source: {
    uri: string;
    content?: ArrayBuffer;
    mimeType: string;
  }): Promise<ExtractionResult> {
    if (!this.canExtract(source.mimeType)) {
      throw new Error(`PdfContentExtractor only supports ${PdfContentExtractor.PDF_MIME_TYPE}`);
    }

    const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

    if (isBrowser) {
      return this.extractBrowser(source);
    }
    return this.extractServer(source);
  }

  private async extractBrowser(source: {
    uri: string;
    content?: ArrayBuffer;
  }): Promise<ExtractionResult> {
    const pdfjs = await import("pdfjs-dist");

    const pdfSource = source.content
      ? { data: new Uint8Array(source.content) }
      : source.uri;

    const loadingTask = pdfjs.getDocument(pdfSource);
    const pdf = await loadingTask.promise;

    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ("str" in item ? item.str : ""))
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

  private async extractServer(source: {
    uri: string;
    content?: ArrayBuffer;
  }): Promise<ExtractionResult> {
    const pdfExtraction = await import("pdf-extraction");

    let dataBuffer: Buffer;

    if (source.content) {
      dataBuffer = Buffer.from(source.content);
    } else {
      const fs = await import("fs");
      dataBuffer = fs.readFileSync(source.uri);
    }

    const data = await pdfExtraction.default(dataBuffer);

    const text: string = data.text || "";
    const pageCount: number = data.numpages || 0;

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

  private async computeHashBrowser(content: string): Promise<string> {
    const data = new TextEncoder().encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  private async computeHashServer(content: string): Promise<string> {
    const crypto = await import("crypto");
    return crypto.createHash("sha256").update(content).digest("hex");
  }
}
