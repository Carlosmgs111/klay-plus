import type { KnowledgeLineageRepository } from "../domain/KnowledgeLineageRepository.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";
export { RegisterTransformation } from "./RegisterTransformation.js";
export type { RegisterTransformationCommand } from "./RegisterTransformation.js";
import { RegisterTransformation } from "./RegisterTransformation.js";
export declare class LineageUseCases {
    readonly registerTransformation: RegisterTransformation;
    constructor(repository: KnowledgeLineageRepository, eventPublisher: EventPublisher);
}
//# sourceMappingURL=index.d.ts.map