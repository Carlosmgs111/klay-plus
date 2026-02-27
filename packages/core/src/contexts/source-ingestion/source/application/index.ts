import type { SourceRepository } from "../domain/SourceRepository.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";

export { RegisterSource } from "./RegisterSource.js";
export type { RegisterSourceCommand } from "./RegisterSource.js";

export { UpdateSource } from "./UpdateSource.js";
export type { UpdateSourceCommand } from "./UpdateSource.js";

import { RegisterSource } from "./RegisterSource.js";
import { UpdateSource } from "./UpdateSource.js";

export class SourceUseCases {
  readonly registerSource: RegisterSource;
  readonly updateSource: UpdateSource;

  constructor(
    repository: SourceRepository,
    eventPublisher: EventPublisher,
  ) {
    this.registerSource = new RegisterSource(repository, eventPublisher);
    this.updateSource = new UpdateSource(repository, eventPublisher);
  }
}
