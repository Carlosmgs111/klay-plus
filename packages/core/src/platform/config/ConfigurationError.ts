/**
 * Error thrown when a required configuration key is missing.
 *
 * @example
 * ```typescript
 * throw new ConfigurationError("OPENAI_API_KEY");
 * // Error: Required configuration key "OPENAI_API_KEY" is not set
 * ```
 */
export class ConfigurationError extends Error {
  public readonly name = "ConfigurationError";

  constructor(
    public readonly key: string,
    message?: string,
  ) {
    super(message ?? `Required configuration key "${key}" is not set`);
  }
}
