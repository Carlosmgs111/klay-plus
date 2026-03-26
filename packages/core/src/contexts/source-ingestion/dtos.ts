export interface SourceSummaryDTO {
  id: string;
  name: string;
  type: string;
  uri: string;
  hasBeenExtracted: boolean;
  currentVersion: number | null;
  registeredAt: string;
}

export interface ListSourcesResult {
  sources: SourceSummaryDTO[];
  total: number;
}

export interface GetSourceInput {
  sourceId: string;
}

export interface SourceDetailDTO extends SourceSummaryDTO {
  versions: Array<{
    version: number;
    contentHash: string;
    extractedAt: string;
  }>;
  extractedTextPreview: string | null;
}

export interface GetSourceResult {
  source: SourceDetailDTO;
}
