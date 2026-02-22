import type { DomainEvent } from "../../../../../shared/domain/index";

export class ExtractionFailed {
  static readonly EVENT_TYPE = "source-ingestion.extraction.failed";

  static is(event: DomainEvent): boolean {
    return event.eventType === ExtractionFailed.EVENT_TYPE;
  }
}
