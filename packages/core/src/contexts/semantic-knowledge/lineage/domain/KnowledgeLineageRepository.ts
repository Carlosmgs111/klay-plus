import type { Repository } from "../../../../shared/domain/index.js";
import type { KnowledgeLineage } from "./KnowledgeLineage.js";
import type { LineageId } from "./LineageId.js";

export interface KnowledgeLineageRepository extends Repository<KnowledgeLineage, LineageId> {
  findBySemanticUnitId(semanticUnitId: string): Promise<KnowledgeLineage | null>;
}
