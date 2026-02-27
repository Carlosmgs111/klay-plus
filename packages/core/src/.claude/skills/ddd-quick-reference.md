# DDD Quick Reference

## Contexto vs Módulo vs Pipeline

| Nivel | Responsabilidad | Tiene Service/Orchestrator | Tiene Dominio |
|-------|-----------------|---------------------------|---------------|
| **Pipeline** | Coordina contextos, expone PipelineOrchestrator | ✅ PipelineOrchestrator | ❌ No |
| **Contexto** | Coordina módulos, expone Service | ✅ ContextService | ✅ Sí (en módulos) |
| **Módulo** | Un Aggregate + Use Cases | ❌ No | ✅ Sí |

**Regla**: Módulos NO se comunican entre sí. Solo el Service coordina.
**Regla**: Contextos NO se comunican entre sí. Solo el Pipeline coordina.

---

## Estructura Mínima — Contexto

```
{context}/
├── index.ts                      # API pública del contexto
├── __tests__/
│   └── e2e.test.ts               # Tests E2E del contexto
├── composition/                  # Composición a nivel de CONTEXTO
│   ├── factory.ts                # {Context}ServicePolicy + resolve{Context}Modules()
│   └── index.ts                  # Re-exports
├── service/                      # Service del CONTEXTO
│   ├── {Context}Service.ts
│   └── index.ts                  # create{Context}Service factory
└── {module}/
    ├── index.ts
    ├── domain/
    │   ├── {Aggregate}.ts        # private constructor + create/reconstitute
    │   ├── {Aggregate}Id.ts
    │   ├── {Aggregate}Repository.ts  # interface (port)
    │   ├── errors/
    │   └── events/
    ├── application/
    │   ├── {UseCase}.ts          # Result<Error, Value>
    │   └── index.ts              # UseCases container
    ├── infrastructure/
    │   └── persistence/
    └── composition/              # ÚNICO lugar para decisiones de infra
        ├── index.ts              # Re-exports (Composer, factory, policies)
        ├── infra-policies.ts     # Types: Policy + ResolvedInfra
        ├── {Module}Composer.ts   # Wiring: métodos privados por concern
        └── {module}.factory.ts   # Retorna { useCases, infra }
```

## Estructura Mínima — Pipeline

```
pipeline/
├── index.ts                      # createPipeline() factory
├── PipelineOrchestrator.ts       # Punto de entrada cross-context
├── PipelineError.ts              # Error con step + completedSteps
├── __tests__/
│   └── e2e.test.ts               # Tests E2E del pipeline
├── use-cases/
│   ├── {Acción}{Dominio}.ts
│   └── index.ts
└── composition/
    ├── index.ts                  # Re-exports
    ├── infra-policies.ts         # PipelinePolicy, ResolvedPipelineServices
    ├── PipelineComposer.ts       # Instancia services según policy
    └── pipeline.factory.ts
```

---

## ConfigProvider Pattern

La `composition/factory.ts` del contexto usa `ConfigProvider` para resolver configuración de ambiente:

```typescript
// composition/factory.ts
async function resolveConfig(policy: ServicePolicy): Promise<ConfigProvider> {
  if (policy.configOverrides) {
    const { InMemoryConfigProvider } = await import("@shared/config/InMemoryConfigProvider");
    return new InMemoryConfigProvider(policy.configOverrides);
  }
  switch (policy.provider) {
    case "browser":
      return new InMemoryConfigProvider({});
    default:
      const { NodeConfigProvider } = await import("@shared/config/NodeConfigProvider");
      return new NodeConfigProvider();
  }
}

// Uso en resolveModules()
const config = await resolveConfig(policy);
const modulePolicy = {
  provider: policy.provider,
  dbPath: policy.dbPath ?? config.getOrDefault("KLAY_DB_PATH", "./data"),
  dbName: policy.dbName ?? config.getOrDefault("KLAY_DB_NAME", "knowledge-platform"),
};
```

---

## Composition: Reglas Críticas

### Estructura Obligatoria
```
composition/
├── index.ts              # Re-exports TODO (obligatorio)
├── infra-policies.ts     # Types
├── {Module}Composer.ts   # Métodos separados por concern
└── {module}.factory.ts   # Retorna { useCases, infra }
```

### Composer Pattern (Obligatorio)
```typescript
export class ModuleComposer {
  // ─── Método por cada concern ───────────────────
  private static async resolveRepository(policy): Promise<Repository> {
    switch (policy.provider) {
      case "in-memory": return new InMemoryRepo();
      case "browser": return new IndexedDBRepo(policy.dbName);
      case "server": return new NeDBRepo(policy.dbPath);
    }
  }

  private static async resolveEventPublisher(_policy): Promise<EventPublisher> {
    const { InMemoryEventPublisher } = await import("@shared/...");
    return new InMemoryEventPublisher();
  }

  // ─── Resolución con Promise.all ────────────────
  static async resolve(policy): Promise<ResolvedInfra> {
    const [repository, eventPublisher] = await Promise.all([
      this.resolveRepository(policy),
      this.resolveEventPublisher(policy),
    ]);
    return { repository, eventPublisher };
  }
}
```

### Factory (Retorna { useCases, infra })
```typescript
// {module}.factory.ts - archivo SEPARADO
export interface ModuleFactoryResult {
  useCases: ModuleUseCases;
  infra: ResolvedModuleInfra;  // Expuesto para coordinación del Service
}

export async function moduleFactory(policy): Promise<ModuleFactoryResult> {
  const infra = await ModuleComposer.resolve(policy);
  const useCases = new ModuleUseCases(infra.repository, infra.eventPublisher);
  return { useCases, infra };  // ¡Retorna AMBOS!
}
```

### composition/index.ts (Obligatorio)
```typescript
export { ModuleComposer } from "./ModuleComposer";
export type { ModuleInfraPolicy, ModuleInfrastructurePolicy, ResolvedModuleInfra } from "./infra-policies";
export { moduleFactory, type ModuleFactoryResult } from "./module.factory";
```

---

## Service Pattern

```typescript
// service/index.ts
export { ContextService } from "./ContextService";
export type { ContextServicePolicy, ResolvedContextModules } from "../composition/factory";

export async function createContextService(
  policy: ContextServicePolicy
): Promise<ContextService> {
  const { resolveContextModules } = await import("../composition/factory");
  const { ContextService } = await import("./ContextService");
  const modules = await resolveContextModules(policy);
  return new ContextService(modules);
}
```

---

## Pipeline Pattern

### Pipeline Composer
```typescript
// composition/PipelineComposer.ts
export class PipelineComposer {
  static async resolve(policy: PipelinePolicy): Promise<ResolvedPipelineServices> {
    // 1. Contextos independientes (paralelo)
    const [ingestion, knowledge] = await Promise.all([
      createSourceIngestionService({ provider: policy.provider }),
      createSemanticKnowledgeService({ provider: policy.provider }),
    ]);

    // 2. Contextos con dependencias (secuencial)
    const processing = await createSemanticProcessingService({ provider: policy.provider });
    const retrieval = await createKnowledgeRetrievalService({
      provider: policy.provider,
      vectorStoreRef: processing.vectorStore, // Wiring cross-context
    });

    return { ingestion, knowledge, processing, retrieval };
  }
}
```

### Workflow Pattern
```typescript
// use-cases/IngestDocumentWorkflow.ts
export class IngestDocumentWorkflow {
  constructor(
    private readonly ingestion: SourceIngestionService,
    private readonly knowledge: SemanticKnowledgeService,
    private readonly processing: SemanticProcessingService,
  ) {}

  async execute(command): Promise<Result<PipelineError, IngestDocumentSuccess>> {
    // Paso 1: Ingerir
    const step1 = await this.ingestion.ingestAndExtract({...});
    if (step1.isFail()) return Result.fail(PipelineError.fromStep("ingestion", step1.error));

    // Paso 2: Crear unidad semántica
    const step2 = await this.knowledge.createSemanticUnitWithLineage({...});
    if (step2.isFail()) return Result.fail(PipelineError.fromStep("knowledge", step2.error, ["ingestion"]));

    // Paso 3: Generar proyección
    const step3 = await this.processing.processContent({...});
    if (step3.isFail()) return Result.fail(PipelineError.fromStep("processing", step3.error, ["ingestion", "knowledge"]));

    return Result.ok({ sourceId, unitId, projectionId, chunksCount });
  }
}
```

### Pipeline Error
```typescript
export class PipelineError extends DomainError {
  constructor(
    readonly step: string,              // Contexto donde falló
    readonly originalError: DomainError, // Error del contexto
    readonly completedSteps: string[],  // Pasos exitosos
  ) {
    super(`Pipeline failed at step '${step}': ${originalError.message}`,
      "PIPELINE_STEP_FAILED", { step, completedSteps });
  }

  static fromStep(step: string, error: DomainError, completed?: string[]) {
    return new PipelineError(step, error, completed ?? []);
  }
}
```

### Pipeline Orchestrator
```typescript
// PipelineOrchestrator.ts
export class PipelineOrchestrator {
  constructor(services: ResolvedPipelineServices) {
    this._ingestDocument = new IngestDocumentWorkflow(services.ingestion, services.knowledge, services.processing);
    this._addSourceToUnit = new AddSourceToUnitWorkflow(services.ingestion, services.knowledge, services.processing);
    this._reprocessKnowledge = new ReprocessKnowledgeWorkflow(services.knowledge, services.processing);
  }

  async ingestDocument(cmd) { return this._ingestDocument.execute(cmd); }
  async addSourceToUnit(cmd) { return this._addSourceToUnit.execute(cmd); }
  async reprocessKnowledge(cmd) { return this._reprocessKnowledge.execute(cmd); }

  // Acceso directo a services individuales
  get ingestion() { return this._services.ingestion; }
  get retrieval() { return this._services.retrieval; }
}
```

### pipeline.ts
```typescript
export { PipelineOrchestrator } from "./PipelineOrchestrator.js";
export { PipelineError } from "./PipelineError.js";
export type { PipelinePolicy, ResolvedPipelineServices } from "./composition/infra-policies.js";

export async function createPipeline(policy: PipelinePolicy): Promise<PipelineOrchestrator> {
  const services = await PipelineComposer.resolve(policy);
  return new PipelineOrchestrator(services);
}
```

---

## Flujo de Composición — 3 Niveles

```
Nivel Módulo:    Policy → Composer → ResolvedInfra → UseCases
Nivel Contexto:  ServicePolicy → resolveModules() → ResolvedModules → Service
Nivel Pipeline:  PipelinePolicy → PipelineComposer → ContextServices → Workflows → PipelineOrchestrator
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
| Adapter detecta `window`/`process` | Composer decide, Adapter es específico |
| Módulo A importa Módulo B | Solo Service coordina módulos |
| Contexto A importa internos de Contexto B | Solo Pipeline coordina contextos |
| Use case crea su repository | Use case recibe repository inyectado |
| Composer con un solo switch gigante | Métodos privados separados por concern |
| Factory en index.ts del módulo | Factory en composition/{module}.factory.ts |
| Factory retorna solo useCases | Factory retorna { useCases, infra } |
| No hay composition/index.ts | index.ts re-exporta todo de composition/ |
| API keys hardcoded | ConfigProvider resuelve desde environment |
| Pipeline contiene lógica de negocio | Pipeline solo coordina services |
| Pipeline accede a repositorios | Pipeline solo usa API pública de services |

---

## Naming

| Elemento | Patrón | Ejemplo |
|----------|--------|---------|
| Aggregate | `{Name}` | `Source` |
| ID | `{Aggregate}Id` | `SourceId` |
| Use Case | `{Verb}{Noun}` | `RegisterSource` |
| Error | `{Concept}{Type}Error` | `SourceNotFoundError` |
| Event | `{Aggregate}{PastVerb}` | `SourceRegistered` |
| Composer | `{Module}Composer` | `SourceComposer` |
| Service | `{Context}Service` | `SourceIngestionService` |
| Factory | `create{Context}Service` | `createSourceIngestionService` |
| EVENT_TYPE | `{context}.{module}.{event}` | `"source-ingestion.source.registered"` |
| Workflow | `{Verb}{Domain}Workflow` | `IngestDocumentWorkflow` |
| Pipeline Factory | `createPipeline` | API pública del pipeline |
| Pipeline Error | `PipelineError` | Único, con `step` discriminante |

---

## Validación Rápida — Módulo

- [ ] ¿Composer decide implementaciones? (no adapters)
- [ ] ¿Adapters NO detectan entorno?
- [ ] ¿Módulo NO importa otros módulos?
- [ ] ¿Use Cases reciben dependencias por constructor?
- [ ] ¿Coordinación SOLO en Service?
- [ ] ¿Factory retorna `{ useCases, infra }`?
- [ ] ¿Existe `composition/index.ts` en cada módulo?
- [ ] ¿`composition/factory.ts` del contexto usa ConfigProvider?
- [ ] ¿Existe `service/index.ts` con `create{Context}Service`?
- [ ] ¿Existe `__tests__/e2e.test.ts`?

## Validación Rápida — Pipeline

- [ ] ¿Pipeline NO contiene lógica de dominio?
- [ ] ¿Pipeline solo invoca services? (nunca repositorios)
- [ ] ¿Cada workflow recibe services por constructor?
- [ ] ¿`execute()` retorna `Result<PipelineError, T>`?
- [ ] ¿`PipelineError` incluye `step` y `completedSteps`?
- [ ] ¿PipelineComposer resuelve wiring cross-context?
- [ ] ¿Existe `createPipeline()` factory en index.ts?
- [ ] ¿Existe `__tests__/e2e.test.ts`?

---

*Actualizado: Febrero 2026*
