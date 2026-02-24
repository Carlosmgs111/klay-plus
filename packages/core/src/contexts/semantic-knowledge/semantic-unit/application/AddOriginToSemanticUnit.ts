import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";
import { SemanticUnitId } from "../domain/SemanticUnitId.js";
import { Origin } from "../domain/Origin.js";
import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";

export interface AddOriginCommand {
  unitId: string;
  sourceId: string;
  sourceType: string;
  extractedAt: Date;
  resourceId?: string;
}

export class AddOriginToSemanticUnit {
  constructor(
    private readonly repository: SemanticUnitRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: AddOriginCommand): Promise<void> {
    const unitId = SemanticUnitId.create(command.unitId);
    const unit = await this.repository.findById(unitId);

    if (!unit) {
      throw new Error(`SemanticUnit ${command.unitId} not found`);
    }

    const origin = Origin.create(
      command.sourceId,
      command.extractedAt,
      command.sourceType,
      command.resourceId,
    );

    unit.addOrigin(origin);

    await this.repository.save(unit);
    await this.eventPublisher.publishAll(unit.clearEvents());
  }
}
