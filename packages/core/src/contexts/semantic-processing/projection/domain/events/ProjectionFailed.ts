import type { DomainEvent } from "../../../../../shared/domain/index.js";

export class ProjectionFailed {
  static readonly EVENT_TYPE = "semantic-processing.projection.failed";

  static is(event: DomainEvent): boolean {
    return event.eventType === ProjectionFailed.EVENT_TYPE;
  }
}
