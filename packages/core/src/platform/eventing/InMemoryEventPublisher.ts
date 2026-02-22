import type { DomainEvent } from "../../shared/domain/DomainEvent";
import type { EventPublisher } from "../../shared/domain/EventPublisher";

type EventHandler = (event: DomainEvent) => void | Promise<void>;

export class InMemoryEventPublisher implements EventPublisher {
  private handlers = new Map<string, Set<EventHandler>>();
  private globalHandlers = new Set<EventHandler>();
  private publishedEvents: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event);

    const typeHandlers = this.handlers.get(event.eventType);
    if (typeHandlers) {
      for (const handler of typeHandlers) {
        await handler(event);
      }
    }

    for (const handler of this.globalHandlers) {
      await handler(event);
    }
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  subscribe(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  subscribeAll(handler: EventHandler): () => void {
    this.globalHandlers.add(handler);
    return () => {
      this.globalHandlers.delete(handler);
    };
  }

  getPublishedEvents(): ReadonlyArray<DomainEvent> {
    return [...this.publishedEvents];
  }

  clear(): void {
    this.publishedEvents = [];
  }
}
