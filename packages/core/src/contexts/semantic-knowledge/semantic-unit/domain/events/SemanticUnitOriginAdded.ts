import type { DomainEvent } from "../../../../../shared/domain/index.js";

export class SemanticUnitOriginAdded {
  static readonly EVENT_TYPE = "semantic-knowledge.semantic-unit.origin-added";

  static is(event: DomainEvent): boolean {
    return event.eventType === SemanticUnitOriginAdded.EVENT_TYPE;
  }
}
