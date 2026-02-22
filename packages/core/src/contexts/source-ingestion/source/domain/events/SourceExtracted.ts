import type { DomainEvent } from "../../../../../shared/domain/index";

export class SourceExtracted {
  static readonly EVENT_TYPE = "source-ingestion.source.extracted";

  static is(event: DomainEvent): boolean {
    return event.eventType === SourceExtracted.EVENT_TYPE;
  }
}
