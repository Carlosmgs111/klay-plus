import type { SourceKnowledgeRepository } from "../source/domain/SourceKnowledgeRepository";
import type { EventPublisher } from "../../../shared/domain/EventPublisher";
import { SourceKnowledgeService } from "../service/SourceKnowledgeService";

// ── Module dependencies ────────────────────────────────────────────

export interface SourceKnowledgeModules {
  sourceKnowledgeRepository: SourceKnowledgeRepository;
  sourceKnowledgeEventPublisher: EventPublisher;
}

export type ResolvedSourceKnowledgeModules = SourceKnowledgeModules;

// ── Factory ────────────────────────────────────────────────────────

export function createSourceKnowledgeContext(
  modules: SourceKnowledgeModules,
): { service: SourceKnowledgeService } {
  return { service: new SourceKnowledgeService(modules) };
}
