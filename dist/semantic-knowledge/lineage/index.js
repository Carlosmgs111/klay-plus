// ─── Domain ────────────────────────────────────────────────────────
export { KnowledgeLineage, LineageId, Transformation, TransformationType, Trace, } from "./domain/index.js";
// ─── Application ───────────────────────────────────────────────────
export { RegisterTransformation, LineageUseCases } from "./application/index.js";
// ─── Composition ───────────────────────────────────────────────────
export { LineageComposer } from "./composition/LineageComposer.js";
export async function lineageFactory(policy) {
    const { LineageComposer } = await import("./composition/LineageComposer.js");
    const { LineageUseCases } = await import("./application/index.js");
    const infra = await LineageComposer.resolve(policy);
    return new LineageUseCases(infra.repository, infra.eventPublisher);
}
//# sourceMappingURL=index.js.map