import type { DomainEvent } from "../../../../../shared/domain/index.js";

export class SemanticUnitCreated {
  static readonly EVENT_TYPE = "semantic-knowledge.semantic-unit.created";

  static is(event: DomainEvent): boolean {
    return event.eventType === SemanticUnitCreated.EVENT_TYPE;
  }
}
