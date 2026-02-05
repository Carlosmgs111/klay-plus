import type { EventPublisher } from "../../../shared/domain/index.js";
import { SemanticUnitId } from "../domain/SemanticUnitId.js";
import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";

export interface DeprecateSemanticUnitCommand {
  unitId: string;
  reason: string;
}

export class DeprecateSemanticUnit {
  constructor(
    private readonly repository: SemanticUnitRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: DeprecateSemanticUnitCommand): Promise<void> {
    const unitId = SemanticUnitId.create(command.unitId);
    const unit = await this.repository.findById(unitId);

    if (!unit) {
      throw new Error(`SemanticUnit ${command.unitId} not found`);
    }

    unit.deprecate(command.reason);

    await this.repository.save(unit);
    await this.eventPublisher.publishAll(unit.clearEvents());
  }
}
