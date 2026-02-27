import type { ContentExtractor, ExtractionResult } from "../../domain/ContentExtractor";

/**
 * PDF Content Extractor for server/Node.js environments.
 * Uses pdf-extraction for server-side PDF parsing.
 */
export class ServerPdfContentExtractor implements ContentExtractor {
  private static readonly PDF_MIME_TYPE = "application/pdf";

  canExtract(mimeType: string): boolean {
    return mimeType === ServerPdfContentExtractor.PDF_MIME_TYPE;
  }

  async extract(source: {
    uri: string;
    content?: ArrayBuffer;
    mimeType: string;
  }): Promise<ExtractionResult> {
    if (!this.canExtract(source.mimeType)) {
      throw new Error(
        `ServerPdfContentExtractor only supports ${ServerPdfContentExtractor.PDF_MIME_TYPE}`,
      );
    }

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

  private async computeHash(content: string): Promise<string> {
    const crypto = await import("crypto");
    return crypto.createHash("sha256").update(content).digest("hex");
  }
}
