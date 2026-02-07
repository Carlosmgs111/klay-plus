import { CreateSemanticUnit } from "./application/CreateSemanticUnit.js";
import { VersionSemanticUnit } from "./application/VersionSemanticUnit.js";
import { DeprecateSemanticUnit } from "./application/DeprecateSemanticUnit.js";
import { ReprocessSemanticUnit } from "./application/ReprocessSemanticUnit.js";
import type { SemanticUnitRepository } from "./domain/SemanticUnitRepository.js";
import type { EventPublisher } from "../../shared/domain/EventPublisher.js";

export class SemanticUnitUseCases {
  readonly createSemanticUnit: CreateSemanticUnit;
  readonly versionSemanticUnit: VersionSemanticUnit;
  readonly deprecateSemanticUnit: DeprecateSemanticUnit;
  readonly reprocessSemanticUnit: ReprocessSemanticUnit;

  constructor(repository: SemanticUnitRepository, eventPublisher: EventPublisher) {
    this.createSemanticUnit = new CreateSemanticUnit(repository, eventPublisher);
    this.versionSemanticUnit = new VersionSemanticUnit(repository, eventPublisher);
    this.deprecateSemanticUnit = new DeprecateSemanticUnit(repository, eventPublisher);
    this.reprocessSemanticUnit = new ReprocessSemanticUnit(repository, eventPublisher);
  }
}
