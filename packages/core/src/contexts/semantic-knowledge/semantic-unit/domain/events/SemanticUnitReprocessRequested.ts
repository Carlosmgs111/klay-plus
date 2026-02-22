import type { DomainEvent } from "../../../../../shared/domain/index.js";

export class SemanticUnitReprocessRequested {
  static readonly EVENT_TYPE = "semantic-knowledge.semantic-unit.reprocess-requested";

  static is(event: DomainEvent): boolean {
    return event.eventType === SemanticUnitReprocessRequested.EVENT_TYPE;
  }
}
