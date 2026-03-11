export type LLMConfig =
  | { type: "openai"; authRef: string; model: string; baseUrl?: string }
  | { type: "anthropic"; authRef: string; model: string }
  | { type: "cohere"; authRef: string; model: string }
  | { type: "ollama"; model: string; baseUrl?: string }
  | { type: "bedrock"; authRef: string; model: string; region: string }
  | { type: "vertex-ai"; authRef: string; model: string; location: string }
  | { type: "azure-openai"; authRef: string; model: string; deploymentName: string; apiVersion?: string };
