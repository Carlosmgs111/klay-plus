import type { EventPublisher } from "../../shared/domain/EventPublisher";
import type { ProviderRegistry } from "../../shared/domain/ProviderRegistry";
import { ProviderRegistryBuilder } from "./ProviderRegistryBuilder";

export function createEventPublisherRegistry(): ProviderRegistry<EventPublisher> {
  const createInMemory = {
    create: async () => {
      const { InMemoryEventPublisher } = await import(
        "../eventing/InMemoryEventPublisher"
      );
      return new InMemoryEventPublisher();
    },
  };

  return new ProviderRegistryBuilder<EventPublisher>()
    .add("in-memory", createInMemory)
    .add("browser", createInMemory)
    .add("server", createInMemory)
    .build();
}
