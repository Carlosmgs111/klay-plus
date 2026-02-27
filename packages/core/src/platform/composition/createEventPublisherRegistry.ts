import type { EventPublisher } from "../../shared/domain/EventPublisher.js";
import type { ProviderRegistry } from "../../shared/domain/ProviderRegistry.js";
import { ProviderRegistryBuilder } from "./ProviderRegistryBuilder.js";

export function createEventPublisherRegistry(): ProviderRegistry<EventPublisher> {
  const createInMemory = {
    create: async () => {
      const { InMemoryEventPublisher } = await import(
        "../eventing/InMemoryEventPublisher.js"
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
