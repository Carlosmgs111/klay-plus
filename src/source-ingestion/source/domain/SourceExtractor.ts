import type { SourceType } from "./SourceType.js";

export interface ExtractionResult {
  rawContent: string;
  contentHash: string;
  metadata: Record<string, string>;
}

export interface SourceExtractor {
  supports(type: SourceType): boolean;
  extract(uri: string, type: SourceType): Promise<ExtractionResult>;
}
