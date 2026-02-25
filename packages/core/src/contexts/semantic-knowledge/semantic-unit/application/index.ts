import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";

// ─── Use Cases ─────────────────────────────────────────────────────
export { CreateSemanticUnit } from "./CreateSemanticUnit.js";
export type { CreateSemanticUnitCommand } from "./CreateSemanticUnit.js";

export { AddSourceToSemanticUnit } from "./AddSourceToSemanticUnit.js";
export type { AddSourceCommand } from "./AddSourceToSemanticUnit.js";

export { RemoveSourceFromSemanticUnit } from "./RemoveSourceFromSemanticUnit.js";
export type { RemoveSourceCommand } from "./RemoveSourceFromSemanticUnit.js";

export { DeprecateSemanticUnit } from "./DeprecateSemanticUnit.js";
export type { DeprecateSemanticUnitCommand } from "./DeprecateSemanticUnit.js";

export { ReprocessSemanticUnit } from "./ReprocessSemanticUnit.js";
export type { ReprocessSemanticUnitCommand } from "./ReprocessSemanticUnit.js";

export { RollbackSemanticUnit } from "./RollbackSemanticUnit.js";
export type { RollbackSemanticUnitCommand } from "./RollbackSemanticUnit.js";

// ─── Use Cases Facade ──────────────────────────────────────────────
import { CreateSemanticUnit } from "./CreateSemanticUnit.js";
import { AddSourceToSemanticUnit } from "./AddSourceToSemanticUnit.js";
import { RemoveSourceFromSemanticUnit } from "./RemoveSourceFromSemanticUnit.js";
import { DeprecateSemanticUnit } from "./DeprecateSemanticUnit.js";
import { ReprocessSemanticUnit } from "./ReprocessSemanticUnit.js";
import { RollbackSemanticUnit } from "./RollbackSemanticUnit.js";

export class SemanticUnitUseCases {
  readonly createSemanticUnit: CreateSemanticUnit;
  readonly addSource: AddSourceToSemanticUnit;
  readonly removeSource: RemoveSourceFromSemanticUnit;
  readonly reprocessSemanticUnit: ReprocessSemanticUnit;
  readonly rollbackSemanticUnit: RollbackSemanticUnit;
  readonly deprecateSemanticUnit: DeprecateSemanticUnit;

  constructor(repository: SemanticUnitRepository, eventPublisher: EventPublisher) {
    this.createSemanticUnit = new CreateSemanticUnit(repository, eventPublisher);
    this.addSource = new AddSourceToSemanticUnit(repository, eventPublisher);
    this.removeSource = new RemoveSourceFromSemanticUnit(repository, eventPublisher);
    this.reprocessSemanticUnit = new ReprocessSemanticUnit(repository, eventPublisher);
    this.rollbackSemanticUnit = new RollbackSemanticUnit(repository, eventPublisher);
    this.deprecateSemanticUnit = new DeprecateSemanticUnit(repository, eventPublisher);
  }
}
