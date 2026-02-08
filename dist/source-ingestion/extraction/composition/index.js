/**
 * Composition Root - Extraction Module
 *
 * This module is ONLY responsible for:
 * - Selecting infrastructure implementations based on policy
 * - Instantiating repositories, extractors, and adapters
 * - Wiring dependencies
 * - Factory construction of UseCases
 *
 * It does NOT contain:
 * - Business logic
 * - Domain rules
 * - Application flows
 */
// ─── Composer (infrastructure wiring only) ──────────────────────────────────
export { ExtractionComposer } from "./ExtractionComposer.js";
// ─── Factory (module entry point) ───────────────────────────────────────────
export { extractionFactory } from "./extraction.factory.js";
//# sourceMappingURL=index.js.map