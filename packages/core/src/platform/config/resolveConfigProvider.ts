import type { ConfigProvider } from "./ConfigProvider";

/**
 * Policy shape expected by the config resolver.
 * Matches the common fields across all facade policies.
 */
export interface ConfigResolutionPolicy {
  provider: string;
  configOverrides?: Record<string, string>;
}

/**
 * Resolves the appropriate ConfigProvider based on policy.
 * Priority: configOverrides > environment detection.
 *
 * - If configOverrides is provided, uses InMemoryConfigProvider.
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

  if (policy.provider === "browser") {
    const { InMemoryConfigProvider } = await import("./InMemoryConfigProvider");
    return new InMemoryConfigProvider({});
  }

  const { NodeConfigProvider } = await import("./NodeConfigProvider");
  return new NodeConfigProvider();
}
