import type { EventPublisher } from "../../../../shared/domain/index.js";
import { SemanticUnitId } from "../domain/SemanticUnitId.js";
import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";

export interface RemoveSourceCommand {
  unitId: string;
  sourceId: string;
}

export class RemoveSourceFromSemanticUnit {
  constructor(
    private readonly repository: SemanticUnitRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: RemoveSourceCommand): Promise<void> {
    const unitId = SemanticUnitId.create(command.unitId);
    const unit = await this.repository.findById(unitId);

    if (!unit) {
      throw new Error(`SemanticUnit ${command.unitId} not found`);
    }

    unit.removeSource(command.sourceId);

    await this.repository.save(unit);
    await this.eventPublisher.publishAll(unit.clearEvents());
  }
}
