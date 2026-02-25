import type { EventPublisher } from "../../../../shared/domain/index.js";
import { SemanticUnitId } from "../domain/SemanticUnitId.js";
import { UnitSource } from "../domain/UnitSource.js";
import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";

export interface AddSourceCommand {
  unitId: string;
  sourceId: string;
  sourceType: string;
  resourceId?: string;
  extractedContent: string;
  contentHash: string;
  processingProfileId: string;
  processingProfileVersion: number;
}

export class AddSourceToSemanticUnit {
  constructor(
    private readonly repository: SemanticUnitRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: AddSourceCommand): Promise<void> {
    const unitId = SemanticUnitId.create(command.unitId);
    const unit = await this.repository.findById(unitId);

    if (!unit) {
      throw new Error(`SemanticUnit ${command.unitId} not found`);
    }

    const source = UnitSource.create(
      command.sourceId,
      command.sourceType,
      command.extractedContent,
      command.contentHash,
      command.resourceId,
    );

    unit.addSource(source, command.processingProfileId, command.processingProfileVersion);

    await this.repository.save(unit);
    await this.eventPublisher.publishAll(unit.clearEvents());
  }
}
