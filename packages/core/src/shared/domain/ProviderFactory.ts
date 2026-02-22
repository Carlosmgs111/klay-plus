/**
 * InfrastructurePolicy — base policy type.
 *
 * Uses an open `provider` string instead of closed union types.
 * Module-specific policies extend this with additional fields.
 */
export interface InfrastructurePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  [key: string]: unknown;
}

/**
 * ProviderFactory<TContract>
 *
 * Creates a concrete infrastructure implementation for a given contract.
 * Supports async creation because all current composers use dynamic imports.
 */
export interface ProviderFactory<TContract> {
  create(policy: InfrastructurePolicy): Promise<TContract> | TContract;
}
