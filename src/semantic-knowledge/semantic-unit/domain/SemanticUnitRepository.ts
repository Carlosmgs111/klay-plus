import type { Repository } from "../../../shared/domain/index.js";
import type { SemanticUnit } from "./SemanticUnit.js";
import type { SemanticUnitId } from "./SemanticUnitId.js";
import type { SemanticState } from "./SemanticState.js";

export interface SemanticUnitRepository extends Repository<SemanticUnit, SemanticUnitId> {
  findByOriginSourceId(sourceId: string): Promise<SemanticUnit[]>;
  findByState(state: SemanticState): Promise<SemanticUnit[]>;
  findByTags(tags: string[]): Promise<SemanticUnit[]>;
  exists(id: SemanticUnitId): Promise<boolean>;
}
