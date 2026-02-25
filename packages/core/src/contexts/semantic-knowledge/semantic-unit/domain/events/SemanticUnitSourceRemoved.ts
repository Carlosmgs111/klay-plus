import type { DomainEvent } from "../../../../../shared/domain/index.js";

export class SemanticUnitSourceRemoved {
  static readonly EVENT_TYPE = "semantic-knowledge.semantic-unit.source-removed";

  static is(event: DomainEvent): boolean {
    return event.eventType === SemanticUnitSourceRemoved.EVENT_TYPE;
  }
}
