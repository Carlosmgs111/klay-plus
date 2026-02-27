import type { KnowledgeLineageRepository } from "../domain/KnowledgeLineageRepository.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";

export { RegisterTransformation } from "./RegisterTransformation.js";
export type { RegisterTransformationCommand } from "./RegisterTransformation.js";

export { LinkSemanticUnits } from "./LinkSemanticUnits.js";
export type { LinkSemanticUnitsCommand } from "./LinkSemanticUnits.js";

export { GetLinkedUnits } from "./GetLinkedUnits.js";
export type { GetLinkedUnitsQuery, LinkedUnitResult } from "./GetLinkedUnits.js";

import { RegisterTransformation } from "./RegisterTransformation.js";
import { LinkSemanticUnits } from "./LinkSemanticUnits.js";
import { GetLinkedUnits } from "./GetLinkedUnits.js";

export class LineageUseCases {
  readonly registerTransformation: RegisterTransformation;
  readonly linkSemanticUnits: LinkSemanticUnits;
  readonly getLinkedUnits: GetLinkedUnits;

  constructor(repository: KnowledgeLineageRepository, eventPublisher: EventPublisher) {
    this.registerTransformation = new RegisterTransformation(repository, eventPublisher);
    this.linkSemanticUnits = new LinkSemanticUnits(repository, eventPublisher);
    this.getLinkedUnits = new GetLinkedUnits(repository);
  }
}
