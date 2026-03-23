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

// ── Provider Field Schema ─────────────────────────────────────────────

export type FieldInputType = "text" | "number" | "select" | "boolean";

/**
 * Declarative specification for a provider-specific configuration field.
 * The UI renders forms automatically from these specs — no hardcoded
 * switch/case per provider needed.
 *
 * To add a new provider:
 *  1. Add the type to the corresponding *Config union (e.g. PersistenceConfig)
 *  2. Add an entry to PROVIDER_REGISTRY with fields/requirements/models
 *  3. Implement the adapter in the platform layer
 *  4. UI renders the form automatically — zero frontend changes needed
 */
export interface ProviderFieldSpec {
  /** Property name in the axis config object (e.g. "path", "basePath").
   *  Supports dot notation for nested objects (e.g. "connection.host"). */
  key: string;
  label: string;
  inputType: FieldInputType;
  placeholder?: string;
  required?: boolean;
  defaultValue?: unknown;
  /** For `inputType: "select"` */
  options?: { value: string; label: string }[];
  /** Small hint text below the field */
  helpText?: string;
  /** Display-only field (e.g. dimensions synced from embedding) */
  readOnly?: boolean;
}

// ── Provider Metadata ─────────────────────────────────────────────────

export interface ProviderMetadata {
  id: string;
  name: string;
  description: string;
  axis: InfrastructureAxis;
  runtimes: RuntimeEnvironment[];
  gateway: ProviderGateway;
  /** Secrets / API keys this provider needs (stored in SecretStore) */
  requirements: ProviderRequirement[];
  /** Embedding model catalog (embedding axis only) */
  models?: EmbeddingModelSpec[];
  /** Declarative field specs — UI renders forms from these automatically */
  fields?: ProviderFieldSpec[];
}

// ── Shared field definitions ──────────────────────────────────────────

const DISTANCE_METRIC_OPTIONS = [
  { value: "cosine", label: "Cosine" },
  { value: "euclidean", label: "Euclidean" },
  { value: "dotProduct", label: "Dot Product" },
];

const vectorStoreCommonFields: ProviderFieldSpec[] = [
  {
    key: "dimensions",
    label: "Dimensions",
    inputType: "number",
    readOnly: true,
    helpText: "Synced from embedding model",
  },
  {
    key: "distanceMetric",
    label: "Distance Metric",
    inputType: "select",
    defaultValue: "cosine",
    options: DISTANCE_METRIC_OPTIONS,
  },
];

// ── Registry (only implemented providers) ─────────────────────────────

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
    id: "indexeddb",
    name: "IndexedDB",
    description: "Browser-native persistent storage",
    axis: "persistence",
    runtimes: ["browser"],
    gateway: "local",
    requirements: [],
    fields: [
      { key: "databaseName", label: "Database Name", inputType: "text", placeholder: "klay-db" },
    ],
  },
  {
    id: "nedb",
    name: "NeDB",
    description: "Server-side file-based storage",
    axis: "persistence",
    runtimes: ["server"],
    gateway: "local",
    requirements: [],
    fields: [
      { key: "path", label: "Database Path", inputType: "text", placeholder: "./data/db" },
    ],
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
    fields: [...vectorStoreCommonFields],
  },
  {
    id: "indexeddb",
    name: "IndexedDB",
    description: "Browser-native vector storage",
    axis: "vectorStore",
    runtimes: ["browser"],
    gateway: "local",
    requirements: [],
    fields: [
      ...vectorStoreCommonFields,
      { key: "databaseName", label: "Database Name", inputType: "text", placeholder: "klay-vectors" },
    ],
  },
  {
    id: "nedb",
    name: "NeDB",
    description: "Server-side file-based vector storage",
    axis: "vectorStore",
    runtimes: ["server"],
    gateway: "local",
    requirements: [],
    fields: [
      ...vectorStoreCommonFields,
      { key: "path", label: "Storage Path", inputType: "text", placeholder: "./data/vectors" },
    ],
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
    id: "local",
    name: "Filesystem",
    description: "Server-side filesystem storage",
    axis: "documentStorage",
    runtimes: ["server"],
    gateway: "local",
    requirements: [],
    fields: [
      { key: "basePath", label: "Base Path", inputType: "text", required: true, defaultValue: "./data/uploads" },
    ],
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
    id: "webllm",
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
    fields: [
      { key: "baseUrl", label: "Base URL", inputType: "text", placeholder: "https://api.openai.com/v1", helpText: "Override for proxies or compatible APIs" },
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
    name: "HuggingFace Transformers",
    description: "Local ONNX embeddings via @huggingface/transformers (no API key needed)",
    axis: "embedding",
    runtimes: ["browser", "server"],
    gateway: "local",
    requirements: [],
    models: [
      {
        id: "Xenova/all-MiniLM-L6-v2",
        name: "all-MiniLM-L6-v2",
        dimensions: 384,
        isDefault: true,
      },
      {
        id: "Xenova/bge-small-en-v1.5",
        name: "BGE Small EN v1.5",
        dimensions: 384,
      },
      {
        id: "nomic-ai/nomic-embed-text-v1.5",
        name: "Nomic Embed Text v1.5",
        dimensions: 768,
      },
    ],
  },

  // ── Embedding: HuggingFace Inference API (remote) ─────────────────
  {
    id: "hf-inference",
    name: "HuggingFace Inference API",
    description: "Remote embeddings via HuggingFace Inference API (@huggingface/inference)",
    axis: "embedding",
    runtimes: ["browser", "server"],
    gateway: "native",
    requirements: [{ key: "HUGGINGFACE_API_KEY", label: "HuggingFace API Key" }],
    models: [
      { id: "sentence-transformers/all-MiniLM-L6-v2", name: "all-MiniLM-L6-v2", dimensions: 384, isDefault: true },
      { id: "sentence-transformers/all-mpnet-base-v2", name: "all-mpnet-base-v2", dimensions: 768 },
      { id: "BAAI/bge-small-en-v1.5", name: "BGE Small EN v1.5", dimensions: 384 },
    ],
  },
];

// ── Query helpers ─────────────────────────────────────────────────────

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
 * Find a single provider by axis + id.
 */
export function getProvider(
  axis: InfrastructureAxis,
  providerId: string,
): ProviderMetadata | undefined {
  return PROVIDER_REGISTRY.find(
    (p) => p.axis === axis && p.id === providerId,
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

/**
 * Collect all secret requirements across the entire profile.
 */
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
    const config = profile[axis];
    if (!config) continue;

    const providerId = typeof config === "object" && "type" in config
      ? (config as { type: string }).type
      : String(config);

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
