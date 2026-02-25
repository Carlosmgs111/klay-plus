import type { DomainEvent } from "../../../../../shared/domain/index.js";

export class SemanticUnitSourceAdded {
  static readonly EVENT_TYPE = "semantic-knowledge.semantic-unit.source-added";

  static is(event: DomainEvent): boolean {
    return event.eventType === SemanticUnitSourceAdded.EVENT_TYPE;
  }
}
