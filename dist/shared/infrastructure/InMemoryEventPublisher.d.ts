import type { DomainEvent } from "../domain/DomainEvent.js";
import type { EventPublisher } from "../domain/EventPublisher.js";
type EventHandler = (event: DomainEvent) => void | Promise<void>;
export declare class InMemoryEventPublisher implements EventPublisher {
    private handlers;
    private globalHandlers;
    private publishedEvents;
    publish(event: DomainEvent): Promise<void>;
    publishAll(events: DomainEvent[]): Promise<void>;
    subscribe(eventType: string, handler: EventHandler): () => void;
    subscribeAll(handler: EventHandler): () => void;
    getPublishedEvents(): ReadonlyArray<DomainEvent>;
    clear(): void;
}
export {};
//# sourceMappingURL=InMemoryEventPublisher.d.ts.map