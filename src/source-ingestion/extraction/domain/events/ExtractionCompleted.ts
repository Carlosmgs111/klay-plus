import type { DomainEvent } from "../../../../shared/domain/index.js";

export class ExtractionCompleted {
  static readonly EVENT_TYPE = "source-ingestion.extraction.completed";

  static is(event: DomainEvent): boolean {
    return event.eventType === ExtractionCompleted.EVENT_TYPE;
  }
}
