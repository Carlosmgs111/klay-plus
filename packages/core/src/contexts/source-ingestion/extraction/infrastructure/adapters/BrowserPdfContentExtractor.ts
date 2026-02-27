import type { ContentExtractor, ExtractionResult } from "../../domain/ContentExtractor";

/**
 * PDF Content Extractor for browser environments.
 * Uses pdfjs-dist for client-side PDF parsing.
 */
export class BrowserPdfContentExtractor implements ContentExtractor {
  private static readonly PDF_MIME_TYPE = "application/pdf";

  canExtract(mimeType: string): boolean {
    return mimeType === BrowserPdfContentExtractor.PDF_MIME_TYPE;
  }

  async extract(source: {
    uri: string;
    content?: ArrayBuffer;
    mimeType: string;
  }): Promise<ExtractionResult> {
    if (!this.canExtract(source.mimeType)) {
      throw new Error(
        `BrowserPdfContentExtractor only supports ${BrowserPdfContentExtractor.PDF_MIME_TYPE}`,
      );
    }

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
        .map((item: unknown) => {
          const textItem = item as { str?: string };
          return textItem.str ?? "";
        })
        .join(" ");
      pages.push(pageText);
    }

    const text = pages.join("\n\n");
    const contentHash = await this.computeHash(text);

    return {
      text,
      contentHash,
      metadata: {
        mimeType: BrowserPdfContentExtractor.PDF_MIME_TYPE,
        pageCount: pdf.numPages,
        characterCount: text.length,
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
