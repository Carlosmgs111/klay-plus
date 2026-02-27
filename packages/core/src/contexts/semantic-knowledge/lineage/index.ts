export {
  KnowledgeLineage,
  LineageId,
  Transformation,
  TransformationType,
  Trace,
} from "./domain";

export type { KnowledgeLineageRepository } from "./domain";

export { lineageFactory } from "./composition";
export type {
  LineageInfrastructurePolicy,
  ResolvedLineageInfra,
  LineageFactoryResult,
} from "./composition";
