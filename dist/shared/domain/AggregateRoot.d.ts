import { Entity } from "./Entity.js";
import { DomainEvent } from "./DomainEvent.js";
export declare abstract class AggregateRoot<Id> extends Entity<Id> {
    private _domainEvents;
    get domainEvents(): ReadonlyArray<DomainEvent>;
    protected record(event: DomainEvent): void;
    clearEvents(): DomainEvent[];
}
//# sourceMappingURL=AggregateRoot.d.ts.map