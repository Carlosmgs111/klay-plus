import type { DomainEvent } from "../../../../../shared/domain/index.js";

export class SemanticUnitRolledBack {
  static readonly EVENT_TYPE = "semantic-knowledge.semantic-unit.rolled-back";

  static is(event: DomainEvent): boolean {
    return event.eventType === SemanticUnitRolledBack.EVENT_TYPE;
  }
}
