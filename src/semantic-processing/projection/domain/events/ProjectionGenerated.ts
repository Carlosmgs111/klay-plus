import type { DomainEvent } from "../../../../shared/domain/index.js";

export class ProjectionGenerated {
  static readonly EVENT_TYPE = "semantic-processing.projection.generated";

  static is(event: DomainEvent): boolean {
    return event.eventType === ProjectionGenerated.EVENT_TYPE;
  }
}
