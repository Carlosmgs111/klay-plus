export { ProcessingStrategy, StrategyId, StrategyType, } from "./domain/index.js";
export type { ProcessingStrategyRepository } from "./domain/index.js";
export { RegisterStrategy, StrategyRegistryUseCases } from "./application/index.js";
export type { RegisterStrategyCommand } from "./application/index.js";
export { StrategyRegistryComposer } from "./composition/StrategyRegistryComposer.js";
export type { StrategyRegistryInfrastructurePolicy, ResolvedStrategyRegistryInfra, } from "./composition/infra-policies.js";
import type { StrategyRegistryInfrastructurePolicy } from "./composition/infra-policies.js";
import type { StrategyRegistryUseCases as _UseCases } from "./application/index.js";
export declare function strategyRegistryFactory(policy: StrategyRegistryInfrastructurePolicy): Promise<_UseCases>;
//# sourceMappingURL=index.d.ts.map