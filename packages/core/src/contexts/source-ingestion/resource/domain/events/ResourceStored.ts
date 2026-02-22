import type { DomainEvent } from "../../../../../shared/domain/index";

export class ResourceStored {
  static readonly EVENT_TYPE = "source-ingestion.resource.stored";

  static is(event: DomainEvent): boolean {
    return event.eventType === ResourceStored.EVENT_TYPE;
  }
}
