import type { SourceKnowledgeRepository } from "../domain/SourceKnowledgeRepository";
import type { SourceKnowledge } from "../domain/SourceKnowledge";
import { BaseInMemoryRepository } from "../../../../platform/persistence/BaseInMemoryRepository";

export class InMemorySourceKnowledgeRepository
  extends BaseInMemoryRepository<SourceKnowledge>
  implements SourceKnowledgeRepository
{
  async findBySourceId(sourceId: string): Promise<SourceKnowledge | null> {
    return this.findOneWhere((sk) => sk.sourceId === sourceId);
  }

  async findByProfileId(profileId: string): Promise<SourceKnowledge[]> {
    return this.findWhere((sk) =>
      sk.hub.hasProjectionForProfile(profileId),
    );
  }
}
