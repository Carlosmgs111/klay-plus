export {
  KnowledgeLineage,
  LineageId,
  Transformation,
  TransformationType,
  Trace,
} from "./domain/index.js";

export type { KnowledgeLineageRepository } from "./domain/index.js";

export { RegisterTransformation, LineageUseCases } from "./application/index.js";
export type { RegisterTransformationCommand } from "./application/index.js";

export { LineageComposer } from "./composition/LineageComposer.js";
export type {
  LineageInfrastructurePolicy,
  ResolvedLineageInfra,
} from "./composition/infra-policies.js";

export { lineageFactory } from "./composition/lineage.factory.js";
export type { LineageFactoryResult } from "./composition/lineage.factory.js";
