// ─── Domain ────────────────────────────────────────────────────────
export { SemanticUnit, SemanticUnitId, SemanticVersion, SemanticState, Origin, Meaning, UnitMetadata, SemanticUnitCreated, SemanticUnitVersioned, SemanticUnitDeprecated, SemanticUnitReprocessRequested, } from "./domain/index.js";
// ─── Application ───────────────────────────────────────────────────
export { CreateSemanticUnit, VersionSemanticUnit, DeprecateSemanticUnit, ReprocessSemanticUnit, SemanticUnitUseCases, } from "./application/index.js";
// ─── Composition ───────────────────────────────────────────────────
export { SemanticUnitComposer } from "./composition/SemanticUnitComposer.js";
export async function semanticUnitFactory(policy) {
    const { SemanticUnitComposer } = await import("./composition/SemanticUnitComposer.js");
    const { SemanticUnitUseCases } = await import("./application/index.js");
    const infra = await SemanticUnitComposer.resolve(policy);
    return new SemanticUnitUseCases(infra.repository, infra.eventPublisher);
}
//# sourceMappingURL=index.js.map