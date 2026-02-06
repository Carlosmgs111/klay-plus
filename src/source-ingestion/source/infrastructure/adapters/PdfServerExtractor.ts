import type {
  SourceExtractor,
  ExtractionResult,
} from "../../domain/SourceExtractor.js";
import { SourceType } from "../../domain/SourceType.js";

/**
 * Server-side PDF extraction using pdf-extraction (Node.js).
 * Reads a PDF from a file path and extracts all text.
 *
 * Usage:
 *   const extractor = new PdfServerExtractor();
 *   const result = await extractor.extract("/path/to/doc.pdf", SourceType.Pdf);
 */
export class PdfServerExtractor implements SourceExtractor {
  supports(type: SourceType): boolean {
    return type === SourceType.Pdf;
  }

  async extract(uri: string, type: SourceType): Promise<ExtractionResult> {
    if (!this.supports(type)) {
      throw new Error(`PdfServerExtractor only supports PDF type`);
    }

    const pdfExtraction = await import("pdf-extraction");
    const fs = await import("fs");

    const dataBuffer = fs.readFileSync(uri);
    const data = await pdfExtraction.default(dataBuffer);

    const rawContent: string = data.text || "";
    const pageCount: number = data.numpages || 0;

    const contentHash = await this.computeHash(rawContent);

    return {
      rawContent,
      contentHash,
      metadata: {
        type: SourceType.Pdf,
        pageCount: String(pageCount),
        characterCount: String(rawContent.length),
        extractor: "pdf-extraction",
      },
    };
  }

  private async computeHash(content: string): Promise<string> {
    const crypto = await import("crypto");
    return crypto.createHash("sha256").update(content).digest("hex");
  }
}
