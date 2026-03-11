export type EmbeddingConfig =
  | { type: "hash"; dimensions?: number }
  | { type: "webllm"; model?: string }
  | { type: "openai"; authRef: string; model: string; dimensions?: number; baseUrl?: string }
  | { type: "cohere"; authRef: string; model: string; dimensions?: number }
  | { type: "huggingface"; authRef: string; model: string; endpointUrl?: string }
  | { type: "ollama"; model: string; baseUrl?: string }
  | { type: "bedrock"; authRef: string; model: string; region: string }
  | { type: "vertex-ai"; authRef: string; model: string; location: string }
  | { type: "azure-openai"; authRef: string; model: string; deploymentName: string; apiVersion?: string }
  | { type: "voyage-ai"; authRef: string; model: string; dimensions?: number };

/** Fingerprint stored with each knowledge context to detect embedding incompatibilities */
export interface EmbeddingFingerprint {
  provider: string;
  model: string;
  dimensions: number;
  /** Distinguishes different endpoints (e.g., Azure OpenAI vs direct OpenAI) */
  baseUrl?: string;
}
