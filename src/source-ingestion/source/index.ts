// ─── Domain ────────────────────────────────────────────────────────
export {
  Source,
  SourceId,
  SourceType,
  SourceVersion,
  SourceRegistered,
  SourceUpdated,
  SourceExtracted,
} from "./domain/index.js";

export type { SourceRepository } from "./domain/index.js";

// ─── Application ───────────────────────────────────────────────────
export { RegisterSource, UpdateSource, SourceUseCases } from "./application/index.js";
export type {
  RegisterSourceCommand,
  UpdateSourceCommand,
} from "./application/index.js";

// ─── Composition ───────────────────────────────────────────────────
export { SourceComposer } from "./composition/SourceComposer.js";
export type {
  SourceInfrastructurePolicy,
  ResolvedSourceInfra,
} from "./composition/infra-policies.js";

// ─── Module Factory ────────────────────────────────────────────────
import type { SourceInfrastructurePolicy } from "./composition/infra-policies.js";
import type { SourceUseCases as _UseCases } from "./application/index.js";
import type { ResolvedSourceInfra } from "./composition/infra-policies.js";

export interface SourceFactoryResult {
  useCases: _UseCases;
  infra: ResolvedSourceInfra;
}

/**
 * Creates the source module with resolved infrastructure.
 * Returns both the use cases and the resolved infra (repository is exposed
 * for facade coordination).
 */
export async function sourceFactory(
  policy: SourceInfrastructurePolicy,
): Promise<SourceFactoryResult> {
  const { SourceComposer } = await import("./composition/SourceComposer.js");
  const { SourceUseCases } = await import("./application/index.js");
  const infra = await SourceComposer.resolve(policy);
  return {
    useCases: new SourceUseCases(infra.repository, infra.eventPublisher),
    infra,
  };
}
