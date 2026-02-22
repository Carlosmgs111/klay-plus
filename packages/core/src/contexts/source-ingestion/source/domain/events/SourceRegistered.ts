import type { DomainEvent } from "../../../../../shared/domain/index";

export class SourceRegistered {
  static readonly EVENT_TYPE = "source-ingestion.source.registered";

  static is(event: DomainEvent): boolean {
    return event.eventType === SourceRegistered.EVENT_TYPE;
  }
}
