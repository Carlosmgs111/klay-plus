import { defineDomainEventWithPayload } from "../../../../../shared/domain/index.js";

export interface ExtractionCompletedPayload {
  sourceId: string;
  contentHash: string;
}

export const ExtractionCompleted = defineDomainEventWithPayload<ExtractionCompletedPayload>(
  "source-ingestion.extraction.completed",
);
