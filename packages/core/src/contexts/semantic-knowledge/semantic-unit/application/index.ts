import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";

// ─── Use Cases ─────────────────────────────────────────────────────
export { CreateSemanticUnit } from "./CreateSemanticUnit.js";
export type { CreateSemanticUnitCommand } from "./CreateSemanticUnit.js";

export { VersionSemanticUnit } from "./VersionSemanticUnit.js";
export type { VersionSemanticUnitCommand } from "./VersionSemanticUnit.js";

export { DeprecateSemanticUnit } from "./DeprecateSemanticUnit.js";
export type { DeprecateSemanticUnitCommand } from "./DeprecateSemanticUnit.js";

export { ReprocessSemanticUnit } from "./ReprocessSemanticUnit.js";
export type { ReprocessSemanticUnitCommand } from "./ReprocessSemanticUnit.js";

export { AddOriginToSemanticUnit } from "./AddOriginToSemanticUnit.js";
export type { AddOriginCommand } from "./AddOriginToSemanticUnit.js";

// ─── Use Cases Facade ──────────────────────────────────────────────
import { CreateSemanticUnit } from "./CreateSemanticUnit.js";
import { VersionSemanticUnit } from "./VersionSemanticUnit.js";
import { DeprecateSemanticUnit } from "./DeprecateSemanticUnit.js";
import { ReprocessSemanticUnit } from "./ReprocessSemanticUnit.js";
import { AddOriginToSemanticUnit } from "./AddOriginToSemanticUnit.js";

export class SemanticUnitUseCases {
  readonly createSemanticUnit: CreateSemanticUnit;
  readonly versionSemanticUnit: VersionSemanticUnit;
  readonly deprecateSemanticUnit: DeprecateSemanticUnit;
  readonly reprocessSemanticUnit: ReprocessSemanticUnit;
  readonly addOrigin: AddOriginToSemanticUnit;

  constructor(repository: SemanticUnitRepository, eventPublisher: EventPublisher) {
    this.createSemanticUnit = new CreateSemanticUnit(repository, eventPublisher);
    this.versionSemanticUnit = new VersionSemanticUnit(repository, eventPublisher);
    this.deprecateSemanticUnit = new DeprecateSemanticUnit(repository, eventPublisher);
    this.reprocessSemanticUnit = new ReprocessSemanticUnit(repository, eventPublisher);
    this.addOrigin = new AddOriginToSemanticUnit(repository, eventPublisher);
  }
}
