// ── ConfigurationError ───────────────────────────────────────────────

export class ConfigurationError extends Error {
  public readonly name = "ConfigurationError";

  constructor(
    public readonly key: string,
    message?: string,
  ) {
    super(message ?? `Required configuration key "${key}" is not set`);
  }
}

// ── ConfigProvider (Port) ────────────────────────────────────────────

export interface ConfigProvider {
  get(key: string): string | undefined;
  require(key: string): string;
  getOrDefault(key: string, defaultValue: string): string;
  has(key: string): boolean;
}

// ── Base Implementation ──────────────────────────────────────────────

abstract class BaseConfigProvider implements ConfigProvider {
  abstract get(key: string): string | undefined;

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

// ── NodeConfigProvider ───────────────────────────────────────────────

export class NodeConfigProvider extends BaseConfigProvider {
  constructor(private readonly env: NodeJS.ProcessEnv = process.env) {
    super();
  }

  get(key: string): string | undefined {
    const value = this.env[key];
    return value === "" ? undefined : value;
  }
}

// ── InMemoryConfigProvider ───────────────────────────────────────────

export class InMemoryConfigProvider extends BaseConfigProvider {
  private readonly values: Map<string, string>;

  constructor(initialValues: Record<string, string> = {}) {
    super();
    this.values = new Map(Object.entries(initialValues));
  }

  get(key: string): string | undefined {
    return this.values.get(key);
  }

  set(key: string, value: string): void {
    this.values.set(key, value);
  }

  delete(key: string): void {
    this.values.delete(key);
  }

  clear(): void {
    this.values.clear();
  }

  entries(): IterableIterator<[string, string]> {
    return this.values.entries();
  }
}

// ── resolveConfigProvider ────────────────────────────────────────────

import type { ConfigStore } from "./ConfigStore";

export interface ConfigResolutionPolicy {
  provider: string;
  configOverrides?: Record<string, string>;
  configStore?: ConfigStore;
}

/**
 * Resolves the appropriate ConfigProvider based on policy.
 * Priority: configOverrides > configStore > browser fallback > server.
 */
export async function resolveConfigProvider(
  policy: ConfigResolutionPolicy,
): Promise<ConfigProvider> {
  if (policy.configOverrides) {
    return new InMemoryConfigProvider(policy.configOverrides);
  }

  if (policy.configStore) {
    const values = await policy.configStore.loadAll();
    return new InMemoryConfigProvider(values);
  }

  if (policy.provider === "browser") {
    return new InMemoryConfigProvider({});
  }

  return new NodeConfigProvider();
}
