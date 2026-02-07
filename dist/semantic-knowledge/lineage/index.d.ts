export { KnowledgeLineage, LineageId, Transformation, TransformationType, Trace, } from "./domain/index.js";
export type { KnowledgeLineageRepository } from "./domain/index.js";
export { RegisterTransformation, LineageUseCases } from "./application/index.js";
export type { RegisterTransformationCommand } from "./application/index.js";
export { LineageComposer } from "./composition/LineageComposer.js";
export type { LineageInfrastructurePolicy, ResolvedLineageInfra, } from "./composition/infra-policies.js";
import type { LineageInfrastructurePolicy } from "./composition/infra-policies.js";
import type { LineageUseCases as _UseCases } from "./application/index.js";
export declare function lineageFactory(policy: LineageInfrastructurePolicy): Promise<_UseCases>;
//# sourceMappingURL=index.d.ts.map