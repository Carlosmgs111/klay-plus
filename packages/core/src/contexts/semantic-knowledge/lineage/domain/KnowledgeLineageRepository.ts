import type { Repository } from "../../../../shared/domain";
import type { KnowledgeLineage } from "./KnowledgeLineage";
import type { LineageId } from "./LineageId";

export interface KnowledgeLineageRepository extends Repository<KnowledgeLineage, LineageId> {
  findBySemanticUnitId(semanticUnitId: string): Promise<KnowledgeLineage | null>;
  findByTraceTargetUnitId(targetUnitId: string): Promise<KnowledgeLineage[]>;
}
