export const CHUNKING_STRATEGIES = [
  { value: "recursive", label: "Recursive — paragraphs, then sentences" },
  { value: "sentence", label: "Sentence — sentence boundaries" },
  { value: "fixed-size", label: "Fixed Size — fixed character count" },
];

export const EMBEDDING_STRATEGIES = [
  { value: "hash-embedding", label: "Hash — local, no API key" },
  { value: "web-llm-embedding", label: "WebLLM — browser, local (WebGPU)" },
  { value: "openai-text-embedding-3-small", label: "OpenAI — text-embedding-3-small" },
  { value: "openai-text-embedding-3-large", label: "OpenAI — text-embedding-3-large" },
  { value: "cohere-embed-multilingual-v3.0", label: "Cohere — embed-multilingual-v3.0" },
  { value: "huggingface-sentence-transformers/all-MiniLM-L6-v2", label: "HuggingFace — all-MiniLM-L6-v2" },
];
