import type { Repository } from "../../../../shared/domain";
import type { KnowledgeLineage } from "./KnowledgeLineage";
import type { LineageId } from "./LineageId";

export interface KnowledgeLineageRepository extends Repository<KnowledgeLineage, LineageId> {
  findByContextId(contextId: string): Promise<KnowledgeLineage | null>;
  findByTraceTargetContextId(targetContextId: string): Promise<KnowledgeLineage[]>;
}
