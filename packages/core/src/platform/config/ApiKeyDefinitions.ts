export interface ApiKeyDefinition {
  key: string;
  label: string;
  provider: string;
}

export const API_KEY_DEFINITIONS: ApiKeyDefinition[] = [
  { key: "OPENAI_API_KEY", label: "OpenAI", provider: "openai" },
  { key: "COHERE_API_KEY", label: "Cohere", provider: "cohere" },
  { key: "HUGGINGFACE_API_KEY", label: "HuggingFace", provider: "huggingface" },
];
