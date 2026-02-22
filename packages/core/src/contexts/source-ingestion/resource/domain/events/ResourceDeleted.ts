import type { DomainEvent } from "../../../../../shared/domain/index";

export class ResourceDeleted {
  static readonly EVENT_TYPE = "source-ingestion.resource.deleted";

  static is(event: DomainEvent): boolean {
    return event.eventType === ResourceDeleted.EVENT_TYPE;
  }
}
