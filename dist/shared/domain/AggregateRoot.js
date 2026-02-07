import { Entity } from "./Entity.js";
export class AggregateRoot extends Entity {
    _domainEvents = [];
    get domainEvents() {
        return [...this._domainEvents];
    }
    record(event) {
        this._domainEvents.push(event);
    }
    clearEvents() {
        const events = [...this._domainEvents];
        this._domainEvents = [];
        return events;
    }
}
//# sourceMappingURL=AggregateRoot.js.map