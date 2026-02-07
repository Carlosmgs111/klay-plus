// ─── Domain ────────────────────────────────────────────────────────
export { ExtractionJob, ExtractionJobId, ExtractionStatus, ExtractionCompleted, ExtractionFailed, } from "./domain/index.js";
// ─── Application ───────────────────────────────────────────────────
export { ExecuteExtraction, ExtractionUseCases } from "./application/index.js";
// ─── Infrastructure Adapters ───────────────────────────────────────
export { TextContentExtractor, PdfContentExtractor, CompositeContentExtractor, } from "./infrastructure/adapters/index.js";
// ─── Composition ───────────────────────────────────────────────────
export { ExtractionComposer } from "./composition/ExtractionComposer.js";
export async function extractionFactory(policy) {
    const { ExtractionComposer } = await import("./composition/ExtractionComposer.js");
    const { ExtractionUseCases } = await import("./application/index.js");
    const infra = await ExtractionComposer.resolve(policy);
    return new ExtractionUseCases(infra.repository, infra.extractor, infra.eventPublisher);
}
//# sourceMappingURL=index.js.map