import type { ContextRepository } from "../context/domain/ContextRepository";
import type { KnowledgeLineageRepository } from "../lineage/domain/KnowledgeLineageRepository";
import type { EventPublisher } from "../../../shared/domain/EventPublisher";
import { ContextManagementService } from "../service/ContextManagementService";

// ── Module dependencies ────────────────────────────────────────────

export interface ContextManagementModules {
  contextRepository: ContextRepository;
  contextEventPublisher: EventPublisher;
  lineageRepository?: KnowledgeLineageRepository;
  lineageEventPublisher?: EventPublisher;
}

export type ResolvedContextManagementModules = ContextManagementModules;

// ── Factory ────────────────────────────────────────────────────────

export function createContextManagementContext(
  modules: ContextManagementModules,
): { service: ContextManagementService } {
  return { service: new ContextManagementService(modules) };
}
