// ─── Facade ──────────────────────────────────────────────────────────────────
export { SourceIngestionFacade } from "./SourceIngestionFacade.js";
// ─── Composition ─────────────────────────────────────────────────────────────
export { SourceIngestionFacadeComposer } from "./composition/SourceIngestionFacadeComposer.js";
/**
 * Factory function to create a fully configured SourceIngestionFacade.
 * This is the main entry point for consuming the Source Ingestion context.
 */
export async function createSourceIngestionFacade(policy) {
    const { SourceIngestionFacadeComposer } = await import("./composition/SourceIngestionFacadeComposer.js");
    const { SourceIngestionFacade } = await import("./SourceIngestionFacade.js");
    const modules = await SourceIngestionFacadeComposer.resolve(policy);
    return new SourceIngestionFacade(modules);
}
//# sourceMappingURL=index.js.map