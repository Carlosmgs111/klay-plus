import type {
  SourceExtractor,
  ExtractionResult,
} from "../../domain/SourceExtractor.js";
import { SourceType } from "../../domain/SourceType.js";

/**
 * Extracts raw text from PlainText, Markdown, CSV, and JSON sources.
 * Browser + Node.js compatible.
 *
 * In the in-memory variant the `uri` parameter IS the content itself.
 * Real implementations would use fetch() or fs to load from the URI.
 */
export class TextSourceExtractor implements SourceExtractor {
  private static readonly SUPPORTED: ReadonlySet<string> = new Set([
    SourceType.PlainText,
    SourceType.Markdown,
    SourceType.Json,
    SourceType.Csv,
  ]);

  supports(type: SourceType): boolean {
    return TextSourceExtractor.SUPPORTED.has(type);
  }

  async extract(uri: string, type: SourceType): Promise<ExtractionResult> {
    if (!this.supports(type)) {
      throw new Error(`TextSourceExtractor does not support type: ${type}`);
    }

    const rawContent = uri;
    const contentHash = await this.computeHash(rawContent);
    const metadata = this.extractMetadata(rawContent, type);

    return { rawContent, contentHash, metadata };
  }

  private async computeHash(content: string): Promise<string> {
    if (typeof globalThis.crypto?.subtle !== "undefined") {
      const data = new TextEncoder().encode(content);
      const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    let hash = 5381;
    for (let i = 0; i < content.length; i++) {
      hash = (hash << 5) + hash + content.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private extractMetadata(
    content: string,
    type: SourceType,
  ): Record<string, string> {
    const metadata: Record<string, string> = {
      type,
      characterCount: String(content.length),
      wordCount: String(content.split(/\s+/).filter(Boolean).length),
    };

    if (type === SourceType.Json) {
      try {
        const parsed = JSON.parse(content);
        metadata["jsonType"] = Array.isArray(parsed) ? "array" : typeof parsed;
      } catch {
        metadata["jsonValid"] = "false";
      }
    }

    return metadata;
  }
}
