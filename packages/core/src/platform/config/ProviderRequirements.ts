import type { InfrastructureProfile } from "./InfrastructureProfile";

export type InfrastructureAxis =
  | "persistence"
  | "vectorStore"
  | "documentStorage"
  | "embedding";

export type RuntimeEnvironment = "browser" | "server" | "test";

export type ProviderGateway = "local" | "ai-sdk" | "native";

export interface ProviderRequirement {
  key: string;
  label: string;
}

export interface EmbeddingModelSpec {
  id: string;
  name: string;
  dimensions: number;
  isDefault?: boolean;
}

export interface ProviderMetadata {
  id: string;
  name: string;
  description: string;
  axis: InfrastructureAxis;
  runtimes: RuntimeEnvironment[];
  gateway: ProviderGateway;
  requirements: ProviderRequirement[];
  models?: EmbeddingModelSpec[];
}

export const PROVIDER_REGISTRY: ProviderMetadata[] = [
  // ── Persistence ────────────────────────────────────────────────────
  {
    id: "in-memory",
    name: "In-Memory",
    description: "Volatile storage for testing",
    axis: "persistence",
    runtimes: ["browser", "server", "test"],
    gateway: "local",
    requirements: [],
  },
  {
    id: "browser",
    name: "IndexedDB",
    description: "Browser-native persistent storage",
    axis: "persistence",
    runtimes: ["browser"],
    gateway: "local",
    requirements: [],
  },
  {
    id: "server",
    name: "NeDB",
    description: "Server-side file-based storage",
    axis: "persistence",
    runtimes: ["server"],
    gateway: "local",
    requirements: [],
  },

  // ── Vector Store ───────────────────────────────────────────────────
  {
    id: "in-memory",
    name: "In-Memory",
    description: "Volatile vector store for testing",
    axis: "vectorStore",
    runtimes: ["browser", "server", "test"],
    gateway: "local",
    requirements: [],
  },
  {
    id: "browser",
    name: "IndexedDB",
    description: "Browser-native vector storage",
    axis: "vectorStore",
    runtimes: ["browser"],
    gateway: "local",
    requirements: [],
  },
  {
    id: "server",
    name: "NeDB",
    description: "Server-side file-based vector storage",
    axis: "vectorStore",
    runtimes: ["server"],
    gateway: "local",
    requirements: [],
  },

  // ── Document Storage ───────────────────────────────────────────────
  {
    id: "in-memory",
    name: "In-Memory",
    description: "Volatile document storage for testing",
    axis: "documentStorage",
    runtimes: ["browser", "server", "test"],
    gateway: "local",
    requirements: [],
  },
  {
    id: "browser",
    name: "Browser",
    description: "Browser-native document storage",
    axis: "documentStorage",
    runtimes: ["browser"],
    gateway: "local",
    requirements: [],
  },
  {
    id: "server",
    name: "Filesystem",
    description: "Server-side filesystem storage",
    axis: "documentStorage",
    runtimes: ["server"],
    gateway: "local",
    requirements: [],
  },

  // ── Embedding: Local ───────────────────────────────────────────────
  {
    id: "hash",
    name: "Hash Embedding",
    description: "Local hash-based embeddings (no API key needed)",
    axis: "embedding",
    runtimes: ["browser", "server", "test"],
    gateway: "local",
    requirements: [],
    models: [
      { id: "hash-128", name: "Hash 128d", dimensions: 128, isDefault: true },
      { id: "hash-256", name: "Hash 256d", dimensions: 256 },
    ],
  },
  {
    id: "browser-webllm",
    name: "WebLLM",
    description: "In-browser ML embeddings via WebLLM",
    axis: "embedding",
    runtimes: ["browser"],
    gateway: "local",
    requirements: [],
    models: [
      {
        id: "Xenova/all-MiniLM-L6-v2",
        name: "all-MiniLM-L6-v2",
        dimensions: 384,
        isDefault: true,
      },
    ],
  },

  // ── Embedding: AI SDK (Vercel) ─────────────────────────────────────
  {
    id: "openai",
    name: "OpenAI",
    description: "OpenAI embeddings via AI SDK (@ai-sdk/openai)",
    axis: "embedding",
    runtimes: ["browser", "server"],
    gateway: "ai-sdk",
    requirements: [{ key: "OPENAI_API_KEY", label: "OpenAI API Key" }],
    models: [
      {
        id: "text-embedding-3-small",
        name: "Text Embedding 3 Small",
        dimensions: 1536,
        isDefault: true,
      },
      {
        id: "text-embedding-3-large",
        name: "Text Embedding 3 Large",
        dimensions: 3072,
      },
      {
        id: "text-embedding-ada-002",
        name: "Ada 002 (legacy)",
        dimensions: 1536,
      },
    ],
  },
  {
    id: "cohere",
    name: "Cohere",
    description: "Cohere embeddings via AI SDK (@ai-sdk/cohere)",
    axis: "embedding",
    runtimes: ["browser", "server"],
    gateway: "ai-sdk",
    requirements: [{ key: "COHERE_API_KEY", label: "Cohere API Key" }],
    models: [
      {
        id: "embed-multilingual-v3.0",
        name: "Embed Multilingual v3",
        dimensions: 1024,
        isDefault: true,
      },
      {
        id: "embed-english-v3.0",
        name: "Embed English v3",
        dimensions: 1024,
      },
      {
        id: "embed-multilingual-light-v3.0",
        name: "Embed Multilingual Light v3",
        dimensions: 384,
      },
    ],
  },
  {
    id: "huggingface",
    name: "HuggingFace",
    description: "HuggingFace embeddings via AI SDK (@ai-sdk/huggingface)",
    axis: "embedding",
    runtimes: ["browser", "server"],
    gateway: "ai-sdk",
    requirements: [
      { key: "HUGGINGFACE_API_KEY", label: "HuggingFace API Key" },
    ],
    models: [
      {
        id: "sentence-transformers/all-MiniLM-L6-v2",
        name: "all-MiniLM-L6-v2",
        dimensions: 384,
        isDefault: true,
      },
      {
        id: "sentence-transformers/all-mpnet-base-v2",
        name: "all-mpnet-base-v2",
        dimensions: 768,
      },
    ],
  },
];

/**
 * Get providers available for an axis, optionally filtered by runtime.
 */
export function getProvidersForAxis(
  axis: InfrastructureAxis,
  runtime?: RuntimeEnvironment,
): ProviderMetadata[] {
  return PROVIDER_REGISTRY.filter(
    (p) =>
      p.axis === axis &&
      (!runtime || p.runtimes.includes(runtime)),
  );
}

/**
 * Get the default model for an embedding provider, if any.
 */
export function getDefaultModel(
  providerId: string,
): EmbeddingModelSpec | undefined {
  const provider = PROVIDER_REGISTRY.find(
    (p) => p.axis === "embedding" && p.id === providerId,
  );
  if (!provider?.models) return undefined;
  return provider.models.find((m) => m.isDefault) ?? provider.models[0];
}

/**
 * Get all models for an embedding provider.
 */
export function getModelsForProvider(
  providerId: string,
): EmbeddingModelSpec[] {
  const provider = PROVIDER_REGISTRY.find(
    (p) => p.axis === "embedding" && p.id === providerId,
  );
  return provider?.models ?? [];
}

export function getProfileRequirements(
  profile: Partial<InfrastructureProfile>,
): ProviderRequirement[] {
  const axes: InfrastructureAxis[] = [
    "persistence",
    "vectorStore",
    "documentStorage",
    "embedding",
  ];
  const seen = new Set<string>();
  const result: ProviderRequirement[] = [];

  for (const axis of axes) {
    const providerId = profile[axis];
    if (!providerId) continue;

    const meta = PROVIDER_REGISTRY.find(
      (p) => p.axis === axis && p.id === providerId,
    );
    if (!meta) continue;

    for (const req of meta.requirements) {
      if (!seen.has(req.key)) {
        seen.add(req.key);
        result.push(req);
      }
    }
  }

  return result;
}
