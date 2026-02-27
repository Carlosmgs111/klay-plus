import type { ConfigProvider } from "./ConfigProvider";
import { ConfigurationError } from "./ConfigurationError";

/**
 * In-memory configuration provider for testing and controlled environments.
 *
 * Allows explicit configuration without relying on environment variables.
 * Supports dynamic updates for test setup/teardown.
 *
 * @example Basic usage
 * ```typescript
 * const config = new InMemoryConfigProvider({
 *   OPENAI_API_KEY: "test-key",
 *   DB_PATH: "/tmp/test-db",
 * });
 *
 * config.get("OPENAI_API_KEY"); // "test-key"
 * config.get("MISSING"); // undefined
 * ```
 *
 * @example Dynamic updates for tests
 * ```typescript
 * const config = new InMemoryConfigProvider({});
 * config.set("TEMP_KEY", "value");
 * // ... run test ...
 * config.delete("TEMP_KEY");
 * ```
 */
export class InMemoryConfigProvider implements ConfigProvider {
  private readonly values: Map<string, string>;

  constructor(initialValues: Record<string, string> = {}) {
    this.values = new Map(Object.entries(initialValues));
  }

  get(key: string): string | undefined {
    return this.values.get(key);
  }

  require(key: string): string {
    const value = this.get(key);
    if (value === undefined) {
      throw new ConfigurationError(key);
    }
    return value;
  }

  getOrDefault(key: string, defaultValue: string): string {
    return this.get(key) ?? defaultValue;
  }

  has(key: string): boolean {
    return this.values.has(key);
  }

  /**
   * Sets a configuration value.
   * Useful for test setup.
   * @param key - The configuration key
   * @param value - The configuration value
   */
  set(key: string, value: string): void {
    this.values.set(key, value);
  }

  /**
   * Removes a configuration value.
   * Useful for test cleanup.
   * @param key - The configuration key
   */
  delete(key: string): void {
    this.values.delete(key);
  }

  /**
   * Clears all configuration values.
   * Useful for resetting state between tests.
   */
  clear(): void {
    this.values.clear();
  }

  /**
   * Returns all configuration entries.
   * Useful for debugging.
   */
  entries(): IterableIterator<[string, string]> {
    return this.values.entries();
  }
}
