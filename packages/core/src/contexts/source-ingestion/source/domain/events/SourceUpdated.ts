import type { DomainEvent } from "../../../../../shared/domain/index";

export class SourceUpdated {
  static readonly EVENT_TYPE = "source-ingestion.source.updated";

  static is(event: DomainEvent): boolean {
    return event.eventType === SourceUpdated.EVENT_TYPE;
  }
}
