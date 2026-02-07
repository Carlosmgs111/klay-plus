export class InMemoryEventPublisher {
    handlers = new Map();
    globalHandlers = new Set();
    publishedEvents = [];
    async publish(event) {
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
    async publishAll(events) {
        for (const event of events) {
            await this.publish(event);
        }
    }
    subscribe(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }
        this.handlers.get(eventType).add(handler);
        return () => {
            this.handlers.get(eventType)?.delete(handler);
        };
    }
    subscribeAll(handler) {
        this.globalHandlers.add(handler);
        return () => {
            this.globalHandlers.delete(handler);
        };
    }
    getPublishedEvents() {
        return [...this.publishedEvents];
    }
    clear() {
        this.publishedEvents = [];
    }
}
//# sourceMappingURL=InMemoryEventPublisher.js.map