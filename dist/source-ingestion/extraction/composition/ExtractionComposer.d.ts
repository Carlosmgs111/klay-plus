import type { ExtractionInfrastructurePolicy, ResolvedExtractionInfra } from "./infra-policies.js";
/**
 * Composer for the Extraction Module.
 *
 * Responsible for resolving infrastructure dependencies based on policy.
 * Each aspect (repository, extractors, publisher) has its own resolver method.
 */
export declare class ExtractionComposer {
    private static resolveRepository;
    private static resolveExtractors;
    private static resolveEventPublisher;
    static resolve(policy: ExtractionInfrastructurePolicy): Promise<ResolvedExtractionInfra>;
}
//# sourceMappingURL=ExtractionComposer.d.ts.map