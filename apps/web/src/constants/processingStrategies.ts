import { getProvidersForAxis, getModelsForProvider, PROVIDER_REGISTRY } from "@klay/core/config";
import type { RuntimeEnvironment, ProviderRequirement } from "@klay/core/config";

export const CHUNKING_STRATEGIES = [
  { value: "recursive", label: "Recursive — paragraphs, then sentences" },
  { value: "sentence", label: "Sentence — sentence boundaries" },
  { value: "fixed-size", label: "Fixed Size — fixed character count" },
];

export function getEmbeddingStrategyOptions(runtime?: RuntimeEnvironment) {
  const providers = getProvidersForAxis("embedding", runtime);
  const options: { value: string; label: string }[] = [];

  for (const provider of providers) {
    const models = getModelsForProvider(provider.id);

    if (models.length === 0) {
      options.push({
        value: `${provider.id}-embedding`,
        label: `${provider.name} — ${provider.description}`,
      });
      continue;
    }

    for (const model of models) {
      // hash/webllm → keep existing IDs for backward compat
      const value = provider.id === "hash"
        ? "hash-embedding"
        : provider.id === "browser-webllm"
          ? "web-llm-embedding"
          : `${provider.id}-${model.id}`;

      options.push({
        value,
        label: `${provider.name} — ${model.name} (${model.dimensions}d)`,
      });

      // For hash/webllm, only emit one option
      if (provider.id === "hash" || provider.id === "browser-webllm") break;
    }
  }

  return options;
}

/**
 * Given an embedding strategy ID (e.g. "openai-text-embedding-3-small"),
 * returns the API key requirements for the underlying provider.
 */
export function getRequirementsForStrategy(strategyId: string): ProviderRequirement[] {
  const embeddingProviders = PROVIDER_REGISTRY.filter((p) => p.axis === "embedding");
  for (const provider of embeddingProviders) {
    if (strategyId.startsWith(provider.id)) {
      return provider.requirements;
    }
  }
  return [];
}

/** @deprecated Use getEmbeddingStrategyOptions(runtime) for runtime-filtered options */
export const EMBEDDING_STRATEGIES = getEmbeddingStrategyOptions();
