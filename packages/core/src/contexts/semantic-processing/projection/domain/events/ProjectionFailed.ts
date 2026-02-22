import type { DomainEvent } from "../../../../../shared/domain/index";

export class ProjectionFailed {
  static readonly EVENT_TYPE = "semantic-processing.projection.failed";

  static is(event: DomainEvent): boolean {
    return event.eventType === ProjectionFailed.EVENT_TYPE;
  }
}
