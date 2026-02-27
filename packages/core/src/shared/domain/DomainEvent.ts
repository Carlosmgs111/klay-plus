export interface DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly payload: Record<string, unknown>;
}

export interface DomainEventClass {
  readonly EVENT_TYPE: string;
  is(event: DomainEvent): boolean;
}

export interface DomainEventClassWithPayload<P> extends DomainEventClass {
  is(event: DomainEvent): event is DomainEvent & { payload: P };
  getPayload(event: DomainEvent): P;
}

export function defineDomainEvent(eventType: string): DomainEventClass {
  return {
    EVENT_TYPE: eventType,
    is: (event: DomainEvent) => event.eventType === eventType,
  };
}

export function defineDomainEventWithPayload<P>(
  eventType: string,
): DomainEventClassWithPayload<P> {
  return {
    EVENT_TYPE: eventType,
    is: (event: DomainEvent): event is DomainEvent & { payload: P } =>
      event.eventType === eventType,
    getPayload: (event: DomainEvent): P => {
      if (event.eventType !== eventType)
        throw new Error(`Event is not a ${eventType} event`);
      return event.payload as P;
    },
  };
}
