import type { Repository } from "../../../../shared/domain";
import type { Source } from "./Source";
import type { SourceId } from "./SourceId";

export interface SourceRepository extends Repository<Source, SourceId> {
  findByUri(uri: string): Promise<Source | null>;
  exists(id: SourceId): Promise<boolean>;
}
