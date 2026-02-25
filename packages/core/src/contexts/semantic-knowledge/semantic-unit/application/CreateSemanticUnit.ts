import type { EventPublisher } from "../../../../shared/domain/index.js";
import { SemanticUnit } from "../domain/SemanticUnit.js";
import { SemanticUnitId } from "../domain/SemanticUnitId.js";
import { UnitMetadata } from "../domain/UnitMetadata.js";
import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";

export interface CreateSemanticUnitCommand {
  id: string;
  name: string;
  description: string;
  language: string;
  createdBy: string;
  tags?: string[];
  attributes?: Record<string, string>;
}

export class CreateSemanticUnit {
  constructor(
    private readonly repository: SemanticUnitRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: CreateSemanticUnitCommand): Promise<void> {
    const unitId = SemanticUnitId.create(command.id);

    const exists = await this.repository.exists(unitId);
    if (exists) {
      throw new Error(`SemanticUnit ${command.id} already exists`);
    }

    const metadata = UnitMetadata.create(
      command.createdBy,
      command.tags ?? [],
      command.attributes ?? {},
    );

    const unit = SemanticUnit.create(
      unitId,
      command.name,
      command.description,
      command.language,
      metadata,
    );

    await this.repository.save(unit);
    await this.eventPublisher.publishAll(unit.clearEvents());
  }
}
