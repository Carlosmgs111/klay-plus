import type { SourceIngestionFacade } from "../../../contexts/source-ingestion/facade/SourceIngestionFacade.js";
import type { SemanticProcessingFacade } from "../../../contexts/semantic-processing/facade/SemanticProcessingFacade.js";
import type { SemanticKnowledgeFacade } from "../../../contexts/semantic-knowledge/facade/SemanticKnowledgeFacade.js";
import type { KnowledgeManagementPort } from "../contracts/KnowledgeManagementPort.js";
import type {
  IngestAndAddSourceInput,
  IngestAndAddSourceSuccess,
} from "../contracts/dtos.js";
import type { Result } from "../../../shared/domain/Result.js";
import type { KnowledgeManagementError } from "../domain/KnowledgeManagementError.js";
import { IngestAndAddSource } from "./use-cases/IngestAndAddSource.js";

/**
 * Resolved dependencies for the KnowledgeManagementOrchestrator.
 * Created by the Composer — not read from policy.
 */
export interface ResolvedManagementDependencies {
  ingestion: SourceIngestionFacade;
  knowledge: SemanticKnowledgeFacade;
  processing: SemanticProcessingFacade;
}

/**
 * KnowledgeManagementOrchestrator — Application Boundary.
 *
 * Implements KnowledgeManagementPort as the single public API for multi-step
 * lifecycle operations on existing semantic units.
 *
 * Receives 3 facades privately (ingestion + knowledge + processing).
 * Creates use cases internally (like the pipeline orchestrator).
 *
 * This is NOT a bounded context — it's an application layer that
 * coordinates existing bounded contexts via their facades.
 *
 * Rules:
 * - No facade getters — facades are private implementation details
 * - No policy reading — the Composer handles infrastructure selection
 * - No domain logic — only delegation to use cases
 * - No framework dependencies — pure TypeScript
 */
export class KnowledgeManagementOrchestrator implements KnowledgeManagementPort {
  private readonly _ingestAndAddSource: IngestAndAddSource;

  constructor(deps: ResolvedManagementDependencies) {
    this._ingestAndAddSource = new IngestAndAddSource(
      deps.ingestion,
      deps.knowledge,
      deps.processing,
    );
  }

  // --- KnowledgeManagementPort Implementation ---

  async ingestAndAddSource(
    input: IngestAndAddSourceInput,
  ): Promise<Result<KnowledgeManagementError, IngestAndAddSourceSuccess>> {
    return this._ingestAndAddSource.execute(input);
  }
}
