# DDD Quick Reference

## Contexto vs Módulo vs Pipeline

| Nivel | Responsabilidad | Tiene Service/Orchestrator | Tiene Dominio |
|-------|-----------------|---------------------------|---------------|
| **Composition root** | Resuelve config, llama coreWiring, crea pipelines | ✅ `composition/root.ts` | ❌ No |
| **Core wiring** | Resuelve inter-context deps, conecta contextos | ✅ `contexts/index.ts` | ❌ No |
| **Contexto** | Coordina módulos via wiring en `index.ts` | ✅ Context wiring (`index.ts`) | ✅ Sí (en módulos) |
| **Módulo** | Un Aggregate + Use Cases | ❌ No | ✅ Sí |

**Regla**: Módulos NO se comunican entre sí. Solo el context wiring (`index.ts`) coordina.
**Regla**: Contextos NO se comunican entre sí. Solo `coreWiring()` coordina.

---

## Estructura Mínima — Contexto

```
{context}/
├── index.ts                      # Context wiring: coordina módulos, resuelve intra-context deps
├── __tests__/
│   └── e2e.test.ts               # Tests E2E del contexto
└── {module}/
    ├── index.ts
    ├── domain/
    │   ├── {Aggregate}.ts        # private constructor + create/reconstitute
    │   ├── {Aggregate}Id.ts
    │   ├── {Aggregate}Repository.ts  # interface (port)
    │   ├── errors/
    │   └── events/
    ├── application/
    │   ├── use-cases/
    │   │   └── {UseCase}.ts      # Result<Error, Value> — DTOs co-located here
    │   └── index.ts
    ├── infrastructure/
    │   └── persistence/
    └── composition/              # ÚNICO lugar para decisiones de infra
        ├── factory.ts            # {module}Factory(policy) → { infra }
        └── wiring.ts             # {module}Wiring(policy, deps?) → use cases wired
```

## Estructura Mínima — Pipelines + Composition Root

```
composition/
├── root.ts                       # createKnowledgeApplication(policy) — composition root

pipelines/
└── process-knowledge/            # Cross-context pipeline
    ├── ProcessKnowledge.ts       # Pipeline class (receives deps, orchestrates steps)
    ├── boundary.ts               # PipelineError
    └── dtos.ts                   # DTOs co-located with pipeline

contexts/
├── index.ts                      # coreWiring(ResolvedConfig) — resolves inter-context deps
└── {context}/
    └── index.ts                  # Context wiring function
```

---

## ConfigProvider Pattern

Config resolution happens at the **composition root** (`composition/root.ts`), not at context level. `resolveConfig(policy)` converts an `OrchestratorPolicy` into a `ResolvedConfig` which is then passed down through `coreWiring()`:

```typescript
// composition/root.ts
export async function createKnowledgeApplication(policy: OrchestratorPolicy) {
  const { resolveConfig } = await import("../config/resolveConfig");
  const config = await resolveConfig(policy);

  const { coreWiring } = await import("../contexts");
  const core = await coreWiring(config);

  // ... create pipelines, wrap search, return KnowledgeApplication
}
```

Context and module wirings receive already-resolved config as infrastructure policies — they do not resolve config themselves.

---

## Composition: Reglas Críticas

### Estructura Obligatoria (por módulo)
```
{module}/composition/
├── factory.ts            # {module}Factory(policy) → { infra: { repository, eventPublisher } }
└── wiring.ts             # {module}Wiring(policy, deps?) → wired use cases
```

### Factory (Retorna { infra })
```typescript
// composition/factory.ts
export type ModuleInfrastructurePolicy = {
  provider: "in-memory" | "browser" | "server";
  dbPath?: string;
  dbName?: string;
};

export async function moduleFactory(policy: ModuleInfrastructurePolicy) {
  // Resolve repository based on policy
  let repository: AggregateRepository;
  switch (policy.provider) {
    case "in-memory":
      const { InMemoryRepo } = await import("../infrastructure/persistence/InMemoryRepo");
      repository = new InMemoryRepo();
      break;
    case "browser":
      const { IndexedDBRepo } = await import("../infrastructure/persistence/indexeddb/IndexedDBRepo");
      repository = new IndexedDBRepo(policy.dbName);
      break;
    case "server":
      const { NeDBRepo } = await import("../infrastructure/persistence/nedb/NeDBRepo");
      repository = new NeDBRepo(policy.dbPath);
      break;
  }

  const { InMemoryEventPublisher } = await import("@shared/infrastructure/InMemoryEventPublisher");
  const eventPublisher = new InMemoryEventPublisher();

  return { infra: { repository, eventPublisher } };
}
```

### Wiring (Creates use cases with resolved infra + deps)
```typescript
// composition/wiring.ts
export interface ModuleWiringDeps {
  // Intra-context deps from other modules (resolved by context wiring)
  somePort: SomePort;
}

export async function moduleWiring(
  policy: ModuleInfrastructurePolicy,
  deps: ModuleWiringDeps,
) {
  const { moduleFactory } = await import("./factory");
  const { infra } = await moduleFactory(policy);

  const { SomeUseCase } = await import("../application/use-cases/SomeUseCase");
  const someUseCase = new SomeUseCase(infra.repository, infra.eventPublisher, deps.somePort);

  return { someUseCase };
}
```

---

## Context Wiring Pattern

Each context exposes a wiring function in its `index.ts` that resolves intra-context deps between modules:

```typescript
// {context}/index.ts
export type ContextInfrastructurePolicy = {
  moduleAInfrastructurePolicy: ModuleAInfrastructurePolicy;
  moduleBInfrastructurePolicy: ModuleBInfrastructurePolicy;
};

export const contextWiring = async (
  policy: ContextInfrastructurePolicy,
  crossContextDeps?: CrossContextDeps, // Optional, only if context needs cross-context ports
) => {
  // 1. Wire independent modules
  const moduleBResult = await moduleBWiring(policy.moduleBInfrastructurePolicy);

  // 2. Wire dependent modules (with intra-context deps)
  const moduleAResult = await moduleAWiring(
    policy.moduleAInfrastructurePolicy,
    { somePort: moduleBResult.somePort }, // Intra-context dep
  );

  return { moduleAResult, moduleBResult };
};
```

---

## Core Wiring Pattern

`coreWiring()` in `contexts/index.ts` resolves inter-context deps:

```typescript
// contexts/index.ts
export const coreWiring = async (config: ResolvedConfig) => {
  const persistenceConfig = { provider: config.persistenceProvider, dbPath: config.dbPath, dbName: config.dbName };

  // 1. Source ingestion (independent)
  const sourceIngestionWiringResult = await sourceIngestionWiring({ ... });

  // 2. Semantic processing (depends on SI: SourceIngestionPort)
  const semanticProcessingWiringResult = await semanticProcessingWiring({
    ...,
    projectionWiringDeps: {
      sourceIngestionPort: { /* resolved inline from SI */ },
    },
  });

  // 3. Context management + Knowledge retrieval (parallel, depend on SI + SP)
  const [contextManagementWiringResult, knowledgeRetrievalWiringResult] =
    await Promise.all([
      contextManagementWiring({ ... }, { enrichment: { ... }, reconciliation: { ... } }),
      knowledgeRetrievalWiring({ semanticQueryInfrastructurePolicy: { ..., vectorStoreConfig } }),
    ]);

  return { contextManagementWiringResult, sourceIngestionWiringResult, ... };
};
```

### Pipeline Pattern
```typescript
// pipelines/process-knowledge/ProcessKnowledge.ts
export class ProcessKnowledge {
  constructor(private readonly deps: {
    ingestAndExtract: IngestAndExtract;
    sourceQueries: SourceQueries;
    projectionOperations: ProjectionOperations;
    contextQueries: ContextQueries;
    addSourceToContext: AddSourceToContext;
  }) {}

  async execute(input): Promise<Result<PipelineError, ProcessKnowledgeResult>> {
    // Step 1: Ingest
    // Step 2: Process projections
    // Step 3: Add to context (catalog)
  }
}
```

### Pipeline Error
```typescript
// pipelines/process-knowledge/boundary.ts
// Plain object error — no error classes
export type PipelineError = {
  step: string;
  code: string;
  message: string;
  completedSteps: string[];
};
```

### Composition Root
```typescript
// composition/root.ts
export async function createKnowledgeApplication(policy: OrchestratorPolicy) {
  const config = await resolveConfig(policy);
  const core = await coreWiring(config);

  // Create ProcessKnowledge pipeline with deps from wired contexts
  const processKnowledge = new ProcessKnowledge({
    ingestAndExtract: core.sourceIngestionWiringResult.sourceWiringResult.ingestAndExtract,
    sourceQueries: core.sourceIngestionWiringResult.sourceWiringResult.sourceQueries,
    projectionOperations: core.semanticProcessingWiringResult.projectionWiringResult.projectionOperations,
    contextQueries: core.contextManagementWiringResult.contextWiringResult.contextQueries,
    addSourceToContext: core.contextManagementWiringResult.contextWiringResult.addSourceToContext,
  });

  // Wrap search with context filter
  // Return KnowledgeApplication namespace object
}
```

---

## Flujo de Composición — 4 Niveles

```
Nivel Módulo:         Policy → factory → { infra } → wiring(policy, deps) → use cases
Nivel Contexto:       ContextPolicy → contextWiring() → calls module wirings, resolves intra-context deps
Nivel Core Wiring:    ResolvedConfig → coreWiring() → calls context wirings, resolves inter-context deps
Nivel Composition:    OrchestratorPolicy → root.ts → resolveConfig → coreWiring → pipelines → KnowledgeApplication
```

---

## Patrones Clave

### Aggregate Root
```typescript
export class Entity extends AggregateRoot<EntityId> {
  private _field: string;
  private constructor(id, field) { super(id); this._field = field; }
  get field(): string { return this._field; }
  static create(id, field): Entity { /* validate + record event */ }
  static reconstitute(id, field): Entity { /* no validation, no events */ }
}
```

### Use Case
```typescript
async execute(cmd): Promise<Result<Error, Entity>> {
  if (!cmd.field) return Result.fail(new FieldRequiredError());
  const entity = Entity.create(id, cmd.field);
  await this.repository.save(entity);
  await this.eventPublisher.publishAll(entity.clearEvents());
  return Result.ok(entity);
}
```

---

## Errores a Evitar

| ❌ Incorrecto | ✅ Correcto |
|--------------|-------------|
| Adapter detecta `window`/`process` | Factory decides, Adapter es específico |
| Módulo A importa Módulo B | Solo context wiring (`index.ts`) coordina módulos |
| Contexto A importa internos de Contexto B | Solo `coreWiring()` coordina contextos |
| Use case crea su repository | Use case recibe repository inyectado |
| Factory retorna solo useCases | Factory retorna `{ infra }`, wiring creates use cases |
| API keys hardcoded | ConfigProvider resuelve desde environment (en composition root) |
| Pipeline contiene lógica de negocio | Pipeline solo coordina use cases |
| Pipeline accede a repositorios | Pipeline solo usa use cases wired por coreWiring |
| Inter-context ports via adapters/ dir | Ports resolved inline in `coreWiring()` |
| Centralized dtos.ts | DTOs co-located with use cases |

---

## Naming

| Elemento | Patrón | Ejemplo |
|----------|--------|---------|
| Aggregate | `{Name}` | `Source` |
| ID | `{Aggregate}Id` | `SourceId` |
| Use Case | `{Verb}{Noun}` | `RegisterSource` |
| Error | `{Concept}{Type}Error` | `SourceNotFoundError` |
| Event | `{Aggregate}{PastVerb}` | `SourceRegistered` |
| Module Factory | `{module}Factory` | `sourceFactory` |
| Module Wiring | `{module}Wiring` | `sourceWiring` |
| Context Wiring | `{context}Wiring` | `sourceIngestionWiring` |
| EVENT_TYPE | `{context}.{module}.{event}` | `"source-ingestion.source.registered"` |
| Pipeline | `{Verb}{Domain}` | `ProcessKnowledge` |
| Pipeline Factory | `createKnowledgeApplication` | API pública (composition root) |
| Pipeline Error | `PipelineError` | Plain object, con `step` discriminante |
| Core Wiring | `coreWiring` | `contexts/index.ts` |

---

## Validación Rápida — Módulo

- [ ] ¿Factory decide implementaciones según policy? (no adapters)
- [ ] ¿Adapters NO detectan entorno?
- [ ] ¿Módulo NO importa otros módulos?
- [ ] ¿Use Cases reciben dependencias por constructor?
- [ ] ¿Coordinación SOLO en context wiring (`index.ts`)?
- [ ] ¿Factory retorna `{ infra }`?
- [ ] ¿Wiring crea use cases y devuelve resultado tipado?
- [ ] ¿DTOs co-located con use cases (no centralizados)?
- [ ] ¿Existe `__tests__/e2e.test.ts`?

## Validación Rápida — Pipeline + Wiring

- [ ] ¿Pipeline NO contiene lógica de dominio?
- [ ] ¿Pipeline recibe use cases/queries como deps? (nunca repositorios)
- [ ] ¿`execute()` retorna `Result<PipelineError, T>`?
- [ ] ¿`PipelineError` incluye `step` y `completedSteps`?
- [ ] ¿`coreWiring()` resuelve inter-context deps inline?
- [ ] ¿Existe `composition/root.ts` con `createKnowledgeApplication()`?
- [ ] ¿Existe `__tests__/e2e.test.ts`?

---

*Actualizado: Marzo 2026*
