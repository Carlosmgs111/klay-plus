import type { SourceInfrastructurePolicy, ResolvedSourceInfra } from "./infra-policies.js";
/**
 * Composer for the Source Module.
 *
 * Responsible for resolving infrastructure dependencies based on policy.
 * Each aspect (repository, publisher) has its own resolver method.
 */
export declare class SourceComposer {
    private static resolveRepository;
    private static resolveEventPublisher;
    static resolve(policy: SourceInfrastructurePolicy): Promise<ResolvedSourceInfra>;
}
//# sourceMappingURL=SourceComposer.d.ts.map