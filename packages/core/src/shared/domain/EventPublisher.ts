import type { DomainEvent } from "./DomainEvent.js";

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}
