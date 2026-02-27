import type { ConfigProvider } from "./ConfigProvider";
import { ConfigurationError } from "./ConfigurationError";

/**
 * Configuration provider for Node.js environments.
 * Uses process.env for accessing environment variables.
 *
 * @example
 * ```typescript
 * const config = new NodeConfigProvider();
 * const dbPath = config.getOrDefault("DB_PATH", "./data");
 * const apiKey = config.require("OPENAI_API_KEY");
 * ```
 *
 * @example With custom env object (for testing)
 * ```typescript
 * const mockEnv = { NODE_ENV: "test", API_KEY: "mock-key" };
 * const config = new NodeConfigProvider(mockEnv);
 * ```
 */
export class NodeConfigProvider implements ConfigProvider {
  constructor(private readonly env: NodeJS.ProcessEnv = process.env) {}

  get(key: string): string | undefined {
    const value = this.env[key];
    // Treat empty strings as undefined for consistency
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
