import type {
  SourceExtractor,
  ExtractionResult,
} from "../../domain/SourceExtractor.js";
import { SourceType } from "../../domain/SourceType.js";

/**
 * Browser-side PDF extraction using pdfjs-dist.
 * Loads the PDF from a URL or ArrayBuffer and extracts text page by page.
 *
 * Usage:
 *   const extractor = new PdfBrowserExtractor();
 *   const result = await extractor.extract("https://example.com/doc.pdf", SourceType.Pdf);
 */
export class PdfBrowserExtractor implements SourceExtractor {
  supports(type: SourceType): boolean {
    return type === SourceType.Pdf;
  }

  async extract(uri: string, type: SourceType): Promise<ExtractionResult> {
    if (!this.supports(type)) {
      throw new Error(`PdfBrowserExtractor only supports PDF type`);
    }

    const pdfjs = await import("pdfjs-dist");

    const loadingTask = pdfjs.getDocument(uri);
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

    const rawContent = pages.join("\n\n");
    const contentHash = await this.computeHash(rawContent);

    return {
      rawContent,
      contentHash,
      metadata: {
        type: SourceType.Pdf,
        pageCount: String(pdf.numPages),
        characterCount: String(rawContent.length),
        extractor: "pdfjs-dist",
      },
    };
  }

  private async computeHash(content: string): Promise<string> {
    const data = new TextEncoder().encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
}
