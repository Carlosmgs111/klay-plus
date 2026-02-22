import type { ProviderFactory } from "./ProviderFactory.js";

/**
 * ProviderRegistry<TContract> — immutable, read-only resolver.
 *
 * Once built, the registry cannot be modified.
 * Resolves a provider name to a ProviderFactory that can create the concrete implementation.
 */
export interface ProviderRegistry<TContract> {
  resolve(provider: string): ProviderFactory<TContract>;
  availableProviders(): string[];
}
