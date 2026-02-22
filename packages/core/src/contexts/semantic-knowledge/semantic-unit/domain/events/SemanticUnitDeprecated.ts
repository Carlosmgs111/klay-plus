import type { DomainEvent } from "../../../../../shared/domain/index.js";

export class SemanticUnitDeprecated {
  static readonly EVENT_TYPE = "semantic-knowledge.semantic-unit.deprecated";

  static is(event: DomainEvent): boolean {
    return event.eventType === SemanticUnitDeprecated.EVENT_TYPE;
  }
}
