import type { Repository } from "../../../../shared/domain";
import type { SourceKnowledge } from "./SourceKnowledge";
import type { SourceKnowledgeId } from "./SourceKnowledgeId";

export interface SourceKnowledgeRepository
  extends Repository<SourceKnowledge, SourceKnowledgeId> {
  findBySourceId(sourceId: string): Promise<SourceKnowledge | null>;
  findByProfileId(profileId: string): Promise<SourceKnowledge[]>;
  exists(id: SourceKnowledgeId): Promise<boolean>;
}
