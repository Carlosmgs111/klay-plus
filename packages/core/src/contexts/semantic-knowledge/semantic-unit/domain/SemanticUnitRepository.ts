import type { Repository } from "../../../../shared/domain";
import type { SemanticUnit } from "./SemanticUnit";
import type { SemanticUnitId } from "./SemanticUnitId";
import type { SemanticState } from "./SemanticState";

export interface SemanticUnitRepository extends Repository<SemanticUnit, SemanticUnitId> {
  findBySourceId(sourceId: string): Promise<SemanticUnit[]>;
  findByState(state: SemanticState): Promise<SemanticUnit[]>;
  findByTags(tags: string[]): Promise<SemanticUnit[]>;
  exists(id: SemanticUnitId): Promise<boolean>;
}
