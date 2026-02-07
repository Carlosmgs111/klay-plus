// ─── Domain ────────────────────────────────────────────────────────
export { ProcessingStrategy, StrategyId, StrategyType, } from "./domain/index.js";
// ─── Application ───────────────────────────────────────────────────
export { RegisterStrategy, StrategyRegistryUseCases } from "./application/index.js";
// ─── Composition ───────────────────────────────────────────────────
export { StrategyRegistryComposer } from "./composition/StrategyRegistryComposer.js";
export async function strategyRegistryFactory(policy) {
    const { StrategyRegistryComposer } = await import("./composition/StrategyRegistryComposer.js");
    const { StrategyRegistryUseCases } = await import("./application/index.js");
    const infra = await StrategyRegistryComposer.resolve(policy);
    return new StrategyRegistryUseCases(infra.repository, infra.eventPublisher);
}
//# sourceMappingURL=index.js.map