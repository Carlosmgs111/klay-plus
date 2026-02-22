/**
 * Configuration Provider Port.
 *
 * Provides environment configuration without coupling to specific
 * environment variable mechanisms (process.env, import.meta.env).
 *
 * This is a READ-ONLY port - it only retrieves configuration values,
 * never modifies them.
 *
 * @example
 * ```typescript
 * const apiKey = config.require("OPENAI_API_KEY");
 * const dbPath = config.getOrDefault("DB_PATH", "./data");
 * ```
 */
export interface ConfigProvider {
  /**
   * Gets a configuration value by key.
   * @param key - The configuration key (e.g., "OPENAI_API_KEY")
   * @returns The value if exists, undefined otherwise
   */
  get(key: string): string | undefined;

  /**
   * Gets a required configuration value by key.
   * @param key - The configuration key
   * @throws ConfigurationError if the key is not found
   * @returns The configuration value
   */
  require(key: string): string;

  /**
   * Gets a configuration value with a default fallback.
   * @param key - The configuration key
   * @param defaultValue - The fallback value if key is not found
   * @returns The configuration value or the default
   */
  getOrDefault(key: string, defaultValue: string): string;

  /**
   * Checks if a configuration key exists.
   * @param key - The configuration key
   * @returns true if the key exists and has a value
   */
  has(key: string): boolean;
}
