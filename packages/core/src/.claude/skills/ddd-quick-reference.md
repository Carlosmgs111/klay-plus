# DDD Quick Reference

## Contexto vs Módulo vs Pipeline

| Nivel | Responsabilidad | Tiene Facade | Tiene Dominio |
|-------|-----------------|--------------|---------------|
| **Pipeline** | Coordina contextos, expone PipelineFacade | ✅ PipelineFacade | ❌ No |
| **Contexto** | Coordina módulos, expone Facade | ✅ ContextFacade | ✅ Sí (en módulos) |
| **Módulo** | Un Aggregate + Use Cases | ❌ No | ✅ Sí |

**Regla**: Módulos NO se comunican entre sí. Solo el Facade coordina.
**Regla**: Contextos NO se comunican entre sí. Solo el Pipeline coordina.

---

## Estructura Mínima — Contexto

```
{context}/
├── index.ts                      # API pública del contexto
├── __tests__/
│   └── e2e.test.ts               # Tests E2E del contexto
├── facade/                       # Facade del CONTEXTO
│   ├── {Context}Facade.ts
│   ├── index.ts                  # create{Context}Facade factory
│   └── composition/
│       ├── index.ts              # Re-exports
│       ├── infra-policies.ts
│       └── {Context}FacadeComposer.ts
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
├── PipelineFacade.ts             # Punto de entrada cross-context
├── PipelineError.ts              # Error con step + completedSteps
├── __tests__/
│   └── e2e.test.ts               # Tests E2E del pipeline
├── workflows/
│   ├── {Acción}{Dominio}Workflow.ts
│   └── index.ts
└── composition/
    ├── index.ts                  # Re-exports
    ├── infra-policies.ts         # PipelinePolicy, ResolvedPipelineFacades
    ├── PipelineComposer.ts       # Instancia facades según policy
    └── pipeline.factory.ts
```

---

## ConfigProvider Pattern

El `FacadeComposer` usa `ConfigProvider` para resolver configuración de ambiente:

```typescript
// FacadeComposer.ts
private static async resolveConfig(policy): Promise<ConfigProvider> {
  if (policy.configOverrides) {
    const { InMemoryConfigProvider } = await import("@shared/config/InMemoryConfigProvider");
    return new InMemoryConfigProvider(policy.configOverrides);
  }
  switch (policy.type) {
    case "browser":
      return new InMemoryConfigProvider({});
    default:
      const { NodeConfigProvider } = await import("@shared/config/NodeConfigProvider");
      return new NodeConfigProvider();
  }
}

// Uso en resolve()
const config = await this.resolveConfig(policy);
const modulePolicy = {
  type: policy.type,
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
    switch (policy.type) {
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
  infra: ResolvedModuleInfra;  // Expuesto para coordinación del Facade
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

## Facade Pattern

```typescript
// facade/index.ts
export { ContextFacade } from "./ContextFacade";
export { ContextFacadeComposer } from "./composition/ContextFacadeComposer";
export type { ContextFacadePolicy, ResolvedContextModules } from "./composition/infra-policies";

export async function createContextFacade(policy): Promise<ContextFacade> {
  const modules = await ContextFacadeComposer.resolve(policy);
  return new ContextFacade(modules);
}
```

---

## Pipeline Pattern

### Pipeline Composer
```typescript
// composition/PipelineComposer.ts
export class PipelineComposer {
  static async resolve(policy: PipelinePolicy): Promise<ResolvedPipelineFacades> {
    // 1. Contextos independientes (paralelo)
    const [ingestion, knowledge] = await Promise.all([
      createSourceIngestionFacade({ type: policy.type }),
      createSemanticKnowledgeFacade({ type: policy.type }),
    ]);

    // 2. Contextos con dependencias (secuencial)
    const processing = await createSemanticProcessingFacade({ type: policy.type });
    const retrieval = await createKnowledgeRetrievalFacade({
      type: policy.type,
      vectorStoreRef: processing.vectorStore, // Wiring cross-context
    });

    return { ingestion, knowledge, processing, retrieval };
  }
}
```

### Workflow Pattern
```typescript
// workflows/IngestDocumentWorkflow.ts
export class IngestDocumentWorkflow {
  constructor(
    private readonly ingestion: SourceIngestionFacade,
    private readonly knowledge: SemanticKnowledgeFacade,
    private readonly processing: SemanticProcessingFacade,
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

### Pipeline Facade
```typescript
// PipelineFacade.ts
export class PipelineFacade {
  constructor(facades: ResolvedPipelineFacades) {
    this._ingestDocument = new IngestDocumentWorkflow(facades.ingestion, facades.knowledge, facades.processing);
    this._addSourceToUnit = new AddSourceToUnitWorkflow(facades.ingestion, facades.knowledge, facades.processing);
    this._reprocessKnowledge = new ReprocessKnowledgeWorkflow(facades.knowledge, facades.processing);
  }

  async ingestDocument(cmd) { return this._ingestDocument.execute(cmd); }
  async addSourceToUnit(cmd) { return this._addSourceToUnit.execute(cmd); }
  async reprocessKnowledge(cmd) { return this._reprocessKnowledge.execute(cmd); }

  // Acceso directo a facades individuales
  get ingestion() { return this._facades.ingestion; }
  get retrieval() { return this._facades.retrieval; }
}
```

### pipeline/index.ts
```typescript
export { PipelineFacade } from "./PipelineFacade.js";
export { PipelineError } from "./PipelineError.js";
export type { PipelinePolicy, ResolvedPipelineFacades } from "./composition/infra-policies.js";

export async function createPipeline(policy: PipelinePolicy): Promise<PipelineFacade> {
  const facades = await PipelineComposer.resolve(policy);
  return new PipelineFacade(facades);
}
```

---

## Flujo de Composición — 3 Niveles

```
Nivel Módulo:    Policy → Composer → ResolvedInfra → UseCases
Nivel Contexto:  ContextPolicy → FacadeComposer → ModuleFactories → Facade
Nivel Pipeline:  PipelinePolicy → PipelineComposer → ContextFacades → Workflows → PipelineFacade
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
| Módulo A importa Módulo B | Solo Facade coordina módulos |
| Contexto A importa internos de Contexto B | Solo Pipeline coordina contextos |
| Use case crea su repository | Use case recibe repository inyectado |
| Composer con un solo switch gigante | Métodos privados separados por concern |
| Factory en index.ts del módulo | Factory en composition/{module}.factory.ts |
| Factory retorna solo useCases | Factory retorna { useCases, infra } |
| No hay composition/index.ts | index.ts re-exporta todo de composition/ |
| API keys hardcoded | ConfigProvider resuelve desde environment |
| Pipeline contiene lógica de negocio | Pipeline solo coordina facades |
| Pipeline accede a repositorios | Pipeline solo usa API pública de facades |

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
| Facade | `{Context}Facade` | `SourceIngestionFacade` |
| FacadeComposer | `{Context}FacadeComposer` | `SourceIngestionFacadeComposer` |
| Factory | `create{Context}Facade` | `createSourceIngestionFacade` |
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
- [ ] ¿Coordinación SOLO en Facade?
- [ ] ¿Factory retorna `{ useCases, infra }`?
- [ ] ¿Existe `composition/index.ts` en cada módulo?
- [ ] ¿FacadeComposer usa ConfigProvider?
- [ ] ¿Existe `facade/index.ts` con `create{Context}Facade`?
- [ ] ¿Existe `__tests__/e2e.test.ts`?

## Validación Rápida — Pipeline

- [ ] ¿Pipeline NO contiene lógica de dominio?
- [ ] ¿Pipeline solo invoca facades? (nunca repositorios)
- [ ] ¿Cada workflow recibe facades por constructor?
- [ ] ¿`execute()` retorna `Result<PipelineError, T>`?
- [ ] ¿`PipelineError` incluye `step` y `completedSteps`?
- [ ] ¿PipelineComposer resuelve wiring cross-context?
- [ ] ¿Existe `createPipeline()` factory en index.ts?
- [ ] ¿Existe `__tests__/e2e.test.ts`?
