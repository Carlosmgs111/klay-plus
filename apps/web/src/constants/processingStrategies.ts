import { getProvidersForAxis, getModelsForProvider, PROVIDER_REGISTRY } from "@klay/core/config";
import type { RuntimeEnvironment, ProviderRequirement } from "@klay/core/config";

export const PREPARATION_STRATEGIES = [
  {
    value: "none",
    label: "Ninguna — sin preprocesamiento",
    defaultConfig: {},
  },
  {
    value: "basic",
    label: "Básica — normalización de texto",
    defaultConfig: {
      normalizeWhitespace: true,
      normalizeEncoding: true,
      trimContent: true,
    },
  },
] as const;

export const FRAGMENTATION_STRATEGIES = [
  {
    value: "recursive",
    label: "Recursive — párrafos, luego oraciones",
    defaultConfig: { strategy: "recursive" as const, chunkSize: 1000, overlap: 100 },
  },
  {
    value: "sentence",
    label: "Sentence — límites de oración",
    defaultConfig: { strategy: "sentence" as const, maxChunkSize: 1000, minChunkSize: 100 },
  },
  {
    value: "fixed-size",
    label: "Fixed Size — tamaño fijo de caracteres",
    defaultConfig: { strategy: "fixed-size" as const, chunkSize: 500, overlap: 50 },
  },
] as const;

/** @deprecated Use FRAGMENTATION_STRATEGIES instead */
export const CHUNKING_STRATEGIES = FRAGMENTATION_STRATEGIES.map(({ value, label }) => ({ value, label }));

export function getEmbeddingStrategyOptions(runtime?: RuntimeEnvironment) {
  const providers = getProvidersForAxis("embedding", runtime);
  const options: { value: string; label: string; defaultConfig: { dimensions?: number; batchSize: number } }[] = [];

  for (const provider of providers) {
    const models = getModelsForProvider(provider.id);

    if (models.length === 0) {
      options.push({
        value: `${provider.id}-embedding`,
        label: `${provider.name} — ${provider.description}`,
        defaultConfig: { batchSize: 100 },
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
        defaultConfig: { dimensions: model.dimensions, batchSize: 100 },
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
