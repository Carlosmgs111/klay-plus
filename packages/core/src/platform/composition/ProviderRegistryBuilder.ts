import type { ProviderFactory } from "../../shared/domain/ProviderFactory.js";
import type { ProviderRegistry } from "../../shared/domain/ProviderRegistry.js";

/**
 * ProviderRegistryBuilder<TContract>
 *
 * Mutable builder that produces an immutable ProviderRegistry.
 * - Duplicate provider names are caught at registration time
 * - The resulting registry is a frozen snapshot
 * - Resolution errors include the list of available providers
 */
export class ProviderRegistryBuilder<TContract> {
  private readonly providers = new Map<string, ProviderFactory<TContract>>();

  /**
   * Register a provider factory under a unique name.
   * @throws Error if the provider name is already registered.
   */
  add(name: string, factory: ProviderFactory<TContract>): this {
    if (this.providers.has(name)) {
      throw new Error(`Provider '${name}' already registered`);
    }
    this.providers.set(name, factory);
    return this;
  }

  /**
   * Build an immutable ProviderRegistry from the registered providers.
   * The builder's internal state is snapshotted; further mutations to
   * the builder do not affect the returned registry.
   */
  build(): ProviderRegistry<TContract> {
    const snapshot = new Map(this.providers);
    return {
      resolve(name: string): ProviderFactory<TContract> {
        const factory = snapshot.get(name);
        if (!factory) {
          throw new Error(
            `Provider '${name}' not registered. Available: [${[...snapshot.keys()].join(", ")}]`,
          );
        }
        return factory;
      },
      availableProviders(): string[] {
        return [...snapshot.keys()];
      },
    };
  }
}
