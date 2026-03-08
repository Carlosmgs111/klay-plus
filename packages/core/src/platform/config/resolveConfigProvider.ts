import type { ConfigProvider } from "./ConfigProvider";
import type { ConfigStore } from "./ConfigStore";

/**
 * Policy shape expected by the config resolver.
 * Matches the common fields across all service policies.
 */
export interface ConfigResolutionPolicy {
  provider: string;
  configOverrides?: Record<string, string>;
  configStore?: ConfigStore;
}

/**
 * Resolves the appropriate ConfigProvider based on policy.
 * Priority: configOverrides > configStore > browser fallback > server.
 *
 * - If configOverrides is provided, uses InMemoryConfigProvider (legacy compat).
 * - If configStore is provided, hydrates InMemoryConfigProvider from store.
 * - If provider is "browser", uses InMemoryConfigProvider with empty config.
 * - Otherwise (server, in-memory, etc.), uses NodeConfigProvider.
 */
export async function resolveConfigProvider(
  policy: ConfigResolutionPolicy,
): Promise<ConfigProvider> {
  if (policy.configOverrides) {
    const { InMemoryConfigProvider } = await import("./InMemoryConfigProvider");
    return new InMemoryConfigProvider(policy.configOverrides);
  }

  if (policy.configStore) {
    const { InMemoryConfigProvider } = await import("./InMemoryConfigProvider");
    const values = await policy.configStore.loadAll();
    return new InMemoryConfigProvider(values);
  }

  if (policy.provider === "browser") {
    const { InMemoryConfigProvider } = await import("./InMemoryConfigProvider");
    return new InMemoryConfigProvider({});
  }

  const { NodeConfigProvider } = await import("./NodeConfigProvider");
  return new NodeConfigProvider();
}
