import type { Repository } from "../../../../shared/domain/index.js";
import type { Source } from "./Source.js";
import type { SourceId } from "./SourceId.js";
import type { SourceType } from "./SourceType.js";

export interface SourceRepository extends Repository<Source, SourceId> {
  findByType(type: SourceType): Promise<Source[]>;
  findByUri(uri: string): Promise<Source | null>;
  exists(id: SourceId): Promise<boolean>;
}
