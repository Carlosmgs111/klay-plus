// ─── Domain ────────────────────────────────────────────────────────
export {
  ProcessingStrategy,
  StrategyId,
  StrategyType,
} from "./domain/index.js";

export type { ProcessingStrategyRepository } from "./domain/index.js";

// ─── Application ───────────────────────────────────────────────────
export { RegisterStrategy, StrategyRegistryUseCases } from "./application/index.js";
export type { RegisterStrategyCommand } from "./application/index.js";

// ─── Composition ───────────────────────────────────────────────────
export { StrategyRegistryComposer } from "./composition/StrategyRegistryComposer.js";
export type {
  StrategyRegistryInfrastructurePolicy,
  ResolvedStrategyRegistryInfra,
} from "./composition/infra-policies.js";

// ─── Module Factory ────────────────────────────────────────────────
import type { StrategyRegistryInfrastructurePolicy } from "./composition/infra-policies.js";
import type { StrategyRegistryUseCases as _UseCases } from "./application/index.js";

export async function strategyRegistryFactory(
  policy: StrategyRegistryInfrastructurePolicy,
): Promise<_UseCases> {
  const { StrategyRegistryComposer } = await import("./composition/StrategyRegistryComposer.js");
  const { StrategyRegistryUseCases } = await import("./application/index.js");
  const infra = await StrategyRegistryComposer.resolve(policy);
  return new StrategyRegistryUseCases(infra.repository, infra.eventPublisher);
}
