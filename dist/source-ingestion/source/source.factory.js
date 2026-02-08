/**
 * Source Module Factory
 *
 * This is the ONLY public entry point for creating the Source module.
 * It resolves infrastructure via composition and constructs use cases.
 *
 * @example
 * ```typescript
 * const { useCases, infra } = await sourceFactory({ type: "server", dbPath: "./data" });
 * await useCases.registerSource.execute({ ... });
 * ```
 */
// ─── Factory Function ────────────────────────────────────────────────────────
export async function sourceFactory(policy) {
    // 1. Resolve infrastructure via Composer (bootstrap only)
    const { SourceComposer } = await import("./composition/SourceComposer.js");
    const infra = await SourceComposer.resolve(policy);
    // 2. Construct use cases with resolved dependencies
    const { SourceUseCases } = await import("./application/index.js");
    const useCases = new SourceUseCases(infra.repository, infra.eventPublisher);
    return { useCases, infra };
}
//# sourceMappingURL=source.factory.js.map