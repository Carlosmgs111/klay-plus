// ─── Domain ────────────────────────────────────────────────────────
export { Source, SourceId, SourceType, SourceVersion, SourceRegistered, SourceUpdated, SourceExtracted, } from "./domain/index.js";
// ─── Application ───────────────────────────────────────────────────
export { RegisterSource, UpdateSource, SourceUseCases } from "./application/index.js";
// ─── Composition ───────────────────────────────────────────────────
export { SourceComposer } from "./composition/SourceComposer.js";
/**
 * Creates the source module with resolved infrastructure.
 * Returns both the use cases and the resolved infra (repository is exposed
 * for facade coordination).
 */
export async function sourceFactory(policy) {
    const { SourceComposer } = await import("./composition/SourceComposer.js");
    const { SourceUseCases } = await import("./application/index.js");
    const infra = await SourceComposer.resolve(policy);
    return {
        useCases: new SourceUseCases(infra.repository, infra.eventPublisher),
        infra,
    };
}
//# sourceMappingURL=index.js.map