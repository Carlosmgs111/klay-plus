import type { DomainEvent } from "../../../../../shared/domain/index";

export interface ExtractionCompletedPayload {
  sourceId: string;
  contentHash: string;
}

export class ExtractionCompleted {
  static readonly EVENT_TYPE = "source-ingestion.extraction.completed";

  static is(event: DomainEvent): event is DomainEvent & { payload: ExtractionCompletedPayload } {
    return event.eventType === ExtractionCompleted.EVENT_TYPE;
  }

  static getPayload(event: DomainEvent): ExtractionCompletedPayload {
    if (!ExtractionCompleted.is(event)) {
      throw new Error("Event is not an ExtractionCompleted event");
    }
    return event.payload as ExtractionCompletedPayload;
  }
}
