import type { DomainEvent } from "../../../../shared/domain/index.js";

export class SemanticUnitVersioned {
  static readonly EVENT_TYPE = "semantic-knowledge.semantic-unit.versioned";

  static is(event: DomainEvent): boolean {
    return event.eventType === SemanticUnitVersioned.EVENT_TYPE;
  }
}
