// ─── Port ────────────────────────────────────────────────────────────────────
export type { ConfigProvider } from "./ConfigProvider.js";
export { ConfigurationError } from "./ConfigurationError.js";

// ─── Adapters ────────────────────────────────────────────────────────────────
export { AstroConfigProvider } from "./AstroConfigProvider.js";
export { NodeConfigProvider } from "./NodeConfigProvider.js";
export { InMemoryConfigProvider } from "./InMemoryConfigProvider.js";

// ─── Config Resolution ──────────────────────────────────────────────────────
export { resolveConfigProvider } from "./resolveConfigProvider.js";
export type { ConfigResolutionPolicy } from "./resolveConfigProvider.js";
