import type { Repository } from "../../../../shared/domain";
import type { Source } from "./Source";
import type { SourceId } from "./SourceId";
import type { SourceType } from "./SourceType";

export interface SourceRepository extends Repository<Source, SourceId> {
  findByType(type: SourceType): Promise<Source[]>;
  findByUri(uri: string): Promise<Source | null>;
  exists(id: SourceId): Promise<boolean>;
}
