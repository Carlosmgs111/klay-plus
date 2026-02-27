import type { ConfigProvider } from "./ConfigProvider";
import { ConfigurationError } from "./ConfigurationError";

/**
 * Configuration provider for Astro environments.
 * Uses import.meta.env for accessing environment variables.
 *
 * Note: In Astro, only variables prefixed with PUBLIC_ are exposed to client-side code.
 * Server-side code can access all environment variables.
 *
 * @example
 * ```typescript
 * // In an Astro component or API route
 * const config = new AstroConfigProvider(import.meta.env);
 * const apiKey = config.require("OPENAI_API_KEY");
 * const publicVar = config.get("PUBLIC_APP_NAME");
 * ```
 */
export class AstroConfigProvider implements ConfigProvider {
  constructor(private readonly env: Record<string, string | undefined>) {}

  get(key: string): string | undefined {
    const value = this.env[key];
    // Astro may return empty strings for undefined vars
    return value === "" ? undefined : value;
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
    return this.get(key) !== undefined;
  }
}
