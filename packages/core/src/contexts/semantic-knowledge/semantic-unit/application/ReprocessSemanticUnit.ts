import type { EventPublisher } from "../../../../shared/domain/index.js";
import { SemanticUnitId } from "../domain/SemanticUnitId.js";
import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";

export interface ReprocessSemanticUnitCommand {
  unitId: string;
  reason: string;
}

export class ReprocessSemanticUnit {
  constructor(
    private readonly repository: SemanticUnitRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: ReprocessSemanticUnitCommand): Promise<void> {
    const unitId = SemanticUnitId.create(command.unitId);
    const unit = await this.repository.findById(unitId);

    if (!unit) {
      throw new Error(`SemanticUnit ${command.unitId} not found`);
    }

    unit.requestReprocessing(command.reason);

    await this.repository.save(unit);
    await this.eventPublisher.publishAll(unit.clearEvents());
  }
}
