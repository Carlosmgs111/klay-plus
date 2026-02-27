# DDD Context Design Skill

## Descripción

Este skill guía el diseño e implementación de **Bounded Contexts**, sus **Módulos** y el **Pipeline Orchestrator** siguiendo Domain-Driven Design (DDD), Arquitectura Hexagonal y patrones funcionales. Basado en la arquitectura de klay+.

---

## 0. Conceptos Fundamentales

### 0.1 Contexto vs Módulo vs Pipeline

| Concepto | Descripción | Ejemplo |
|----------|-------------|---------|
| **Bounded Context** | Límite semántico que encapsula un subdominio completo. Contiene uno o más módulos. | `source-ingestion` |
| **Módulo** | Unidad cohesiva dentro de un contexto. Contiene un Aggregate Root y sus colaboradores. | `source`, `extraction` |
| **Pipeline** | Capa de coordinación cross-context. Orquesta flujos de usuario que atraviesan múltiples contextos. | `pipeline` |

**Regla crítica**: Los módulos NO se comunican directamente entre sí. La coordinación entre módulos ocurre **exclusivamente a nivel de contexto**, mediante:
- Un **Service** a nivel de contexto

**Regla crítica**: Los contextos NO se comunican directamente entre sí. La coordinación entre contextos ocurre **exclusivamente a nivel de pipeline**, mediante:
- Un **Pipeline Orchestrator** que invoca services
- **Eventos de integración** (comunicación asíncrona)

### 0.2 Responsabilidades por Nivel

```
PIPELINE (Pipeline Orchestrator)
├── Orquestación de workflows que involucran múltiples CONTEXTOS
├── PipelineOrchestrator como punto de entrada único cross-context
├── Composición de services (PipelineComposer)
├── NO contiene lógica de dominio
├── NO accede a repositorios
└── Solo interactúa con la API pública de cada service

CONTEXTO (Bounded Context)
├── Orquestación de workflows que involucran múltiples módulos
├── Service como punto de entrada único del contexto
├── Composición de módulos (composition/factory.ts)
└── Políticas de infraestructura a nivel de contexto

MÓDULO (dentro del contexto)
├── Un Aggregate Root + Value Objects
├── Use Cases que operan SOLO sobre su propio Aggregate
├── Composer que resuelve SU infraestructura
├── NO coordina otros módulos
└── NO tiene Service propio
```

---

## 1. Estructura de un Bounded Context

```
{context-name}/
├── index.ts                          # API pública del contexto
├── ARCHITECTURE.md                   # Documentación arquitectónica
├── __tests__/
│   └── e2e.test.ts                   # Tests end-to-end (OBLIGATORIO)
│
├── composition/                      # COMPOSICIÓN A NIVEL DE CONTEXTO
│   ├── factory.ts                    # {Context}ServicePolicy + resolve{Context}Modules()
│   └── index.ts                      # Re-exports (OBLIGATORIO)
│
├── service/                          # SERVICE DEL CONTEXTO
│   ├── {ContextName}Service.ts       # Orchestrator (coordina módulos)
│   └── index.ts                      # create{Context}Service factory
│
├── {module-a}/                       # Módulo A
│   ├── index.ts
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── composition/
│       ├── index.ts                  # Re-exports (OBLIGATORIO)
│       ├── infra-policies.ts
│       ├── {ModuleA}Composer.ts
│       └── {module-a}.factory.ts     # Retorna { useCases, infra }
│
└── {module-b}/                       # Módulo B
    ├── index.ts
    ├── domain/
    ├── application/
    ├── infrastructure/
    └── composition/
        ├── index.ts                  # Re-exports (OBLIGATORIO)
        ├── infra-policies.ts
        ├── {ModuleB}Composer.ts
        └── {module-b}.factory.ts     # Retorna { useCases, infra }
```

### 1.1 Estructura de un Módulo

```
{module-name}/
├── index.ts                          # Re-exports del módulo
├── domain/
│   ├── {Aggregate}.ts                # Aggregate Root
│   ├── {Aggregate}Id.ts              # Value Object ID
│   ├── {ValueObject}.ts              # Value Objects adicionales
│   ├── {Aggregate}Repository.ts      # Port (interfaz)
│   ├── {Port}.ts                     # Otros ports (ej: ContentExtractor)
│   ├── errors/
│   │   ├── {Module}Errors.ts
│   │   └── index.ts
│   ├── events/
│   │   └── {EventName}.ts
│   └── index.ts
├── application/
│   ├── {UseCaseName}.ts              # Use Cases (operan sobre SU aggregate)
│   └── index.ts                      # {Module}UseCases container
├── infrastructure/
│   ├── adapters/                     # Implementaciones de ports
│   │   └── {AdapterName}.ts
│   └── persistence/
│       ├── InMemory{Aggregate}Repository.ts
│       ├── indexeddb/
│       └── nedb/
└── composition/                      # ÚNICA ubicación para decisiones de infra
    ├── index.ts                      # Re-exports TODO (OBLIGATORIO)
    ├── infra-policies.ts             # Types: Policy + ResolvedInfra
    ├── {Module}Composer.ts           # Métodos privados por concern
    └── {module}.factory.ts           # Retorna { useCases, infra }
```

### 1.2 composition/index.ts (OBLIGATORIO)

Cada módulo DEBE tener un `composition/index.ts` que re-exporta todo:

```typescript
// composition/index.ts
export { ModuleComposer } from "./ModuleComposer";
export type {
  ModuleInfraPolicy,
  ModuleInfrastructurePolicy,
  ResolvedModuleInfra,
} from "./infra-policies";
export { moduleFactory, type ModuleFactoryResult } from "./module.factory";
```

---

## 2. Capa Composition: Rol y Responsabilidades

### 2.1 Definición

La carpeta `composition/` es el **único lugar** donde se toman decisiones de infraestructura. Su responsabilidad es:

1. **Resolver adaptadores** según la política recibida
2. **Resolver repositorios** (InMemory, IndexedDB, NeDB, etc.)
3. **Resolver extractores/processors** y otros ports
4. **Resolver event publishers**
5. **Ensamblar** el módulo con sus dependencias resueltas

### 2.2 Reglas Estrictas

```
✅ CORRECTO                              ❌ INCORRECTO
───────────────────────────────────────────────────────────────────
Composer decide qué Repository usar      Adapter detecta si es browser/server
Composer importa dinámicamente adapters  Repository decide su implementación
Política viene de arriba (context)       Adapter lee process.env o window
Factory retorna { useCases, infra }      Factory retorna solo useCases
Métodos privados separados por concern   Un solo switch que resuelve todo
Factory en {module}.factory.ts           Factory inline en index.ts del módulo
composition/index.ts re-exporta todo     No hay index.ts en composition/
composition/factory.ts usa ConfigProvider API keys/paths hardcodeados
configOverrides permite testing          Tests dependen de environment real
```

### 2.3 ConfigProvider Pattern

La `composition/factory.ts` del contexto usa `ConfigProvider` para resolver configuración de ambiente de forma testeable:

```typescript
// composition/factory.ts
async function resolveConfig(
  policy: ServicePolicy
): Promise<ConfigProvider> {
  // 1. Si hay overrides de test, usar InMemoryConfigProvider
  if (policy.configOverrides) {
    const { InMemoryConfigProvider } = await import(
      "@shared/config/InMemoryConfigProvider"
    );
    return new InMemoryConfigProvider(policy.configOverrides);
  }

  // 2. Para browser, config vacía (no hay process.env)
  if (policy.provider === "browser") {
    const { InMemoryConfigProvider } = await import(
      "@shared/config/InMemoryConfigProvider"
    );
    return new InMemoryConfigProvider({});
  }

  // 3. Para server, usar NodeConfigProvider (lee process.env)
  const { NodeConfigProvider } = await import(
    "@shared/config/NodeConfigProvider"
  );
  return new NodeConfigProvider();
}

// Uso en resolveModules()
export async function resolveContextModules(
  policy: ServicePolicy
): Promise<ResolvedModules> {
  const config = await resolveConfig(policy);

  const modulePolicy = {
    provider: policy.provider,
    dbPath: policy.dbPath ?? config.getOrDefault("KLAY_DB_PATH", "./data"),
    dbName: policy.dbName ?? config.getOrDefault("KLAY_DB_NAME", "knowledge-platform"),
  };

  // Continuar con resolución de módulos...
}
```

**Variables de configuración comunes:**
- `KLAY_DB_PATH`: Ruta para bases de datos NeDB (server)
- `KLAY_DB_NAME`: Nombre de base de datos IndexedDB (browser)
- API keys y tokens deben resolverse via ConfigProvider, nunca hardcodeados

### 2.4 Composer (Obligatorio)

```typescript
import type {
  {Module}InfrastructurePolicy,
  Resolved{Module}Infra,
} from "./infra-policies";

/**
 * Composer: ÚNICO responsable de decisiones de infraestructura.
 * Los adapters NO detectan entorno por sí mismos.
 */
export class {Module}Composer {
  // ─── Resolver Repositorio ─────────────────────────────────
  private static async resolveRepository(
    policy: {Module}InfrastructurePolicy,
  ): Promise<{Aggregate}Repository> {
    // La POLÍTICA determina qué implementación usar
    switch (policy.provider) {
      case "in-memory": {
        const { InMemory{Aggregate}Repository } = await import(
          "../infrastructure/persistence/InMemory{Aggregate}Repository"
        );
        return new InMemory{Aggregate}Repository();
      }

      case "browser": {
        const { IndexedDB{Aggregate}Repository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDB{Aggregate}Repository"
        );
        return new IndexedDB{Aggregate}Repository(policy.dbName ?? "default-db");
      }

      case "server": {
        const { NeDB{Aggregate}Repository } = await import(
          "../infrastructure/persistence/nedb/NeDB{Aggregate}Repository"
        );
        return new NeDB{Aggregate}Repository(policy.dbPath);
      }

      default:
        throw new Error(`Unknown policy provider: ${(policy as any).provider}`);
    }
  }

  // ─── Resolver otros ports ─────────────────────────────────
  private static async resolveEventPublisher(
    _policy: {Module}InfrastructurePolicy,
  ): Promise<EventPublisher> {
    const { InMemoryEventPublisher } = await import(
      "@shared/infrastructure/InMemoryEventPublisher"
    );
    return new InMemoryEventPublisher();
  }

  // ─── Resolución Principal ─────────────────────────────────
  static async resolve(
    policy: {Module}InfrastructurePolicy,
  ): Promise<Resolved{Module}Infra> {
    const [repository, eventPublisher] = await Promise.all([
      this.resolveRepository(policy),
      this.resolveEventPublisher(policy),
    ]);

    return { repository, eventPublisher };
  }
}
```

### 2.5 Factory (Retorna { useCases, infra })

El archivo `{module}.factory.ts` es necesario cuando el módulo participa en un Service. **Siempre retorna `{ useCases, infra }`** para permitir coordinación.

```typescript
// {module}.factory.ts - archivo SEPARADO en composition/
export interface {Module}FactoryResult {
  useCases: {Module}UseCases;
  infra: Resolved{Module}Infra;  // Expuesto para coordinación del Service
}

export async function {module}Factory(
  policy: {Module}InfrastructurePolicy,
): Promise<{Module}FactoryResult> {
  const infra = await {Module}Composer.resolve(policy);
  const useCases = new {Module}UseCases(infra.repository, infra.eventPublisher);
  return { useCases, infra };  // ¡Retorna AMBOS!
}
```

**¿Por qué retornar `infra`?**
- El Service puede necesitar acceso al repository para queries cross-module
- Permite coordinación sin acoplar módulos entre sí
- El Service actúa como anti-corruption layer

---

## 3. Service (Nivel de Contexto)

### 3.1 Ubicación y Responsabilidad

El Service existe **a nivel de contexto**, NO de módulo. Es el único punto de coordinación entre módulos.

```
source-ingestion/
├── composition/
│   ├── factory.ts                    ← ServicePolicy + resolveModules()
│   └── index.ts                      ← Re-exports
├── service/
│   ├── SourceIngestionService.ts     ← Service del CONTEXTO
│   └── index.ts                      ← createSourceIngestionService factory
├── source/                           ← Módulo (NO tiene service propio)
└── extraction/                       ← Módulo (NO tiene service propio)
```

### 3.2 service/index.ts (Patrón Obligatorio)

```typescript
// service/index.ts
export { ContextService } from "./ContextService";
export type {
  ContextServicePolicy,
  ResolvedContextModules,
} from "../composition/factory";

// Factory function como API principal
export async function createContextService(
  policy: ContextServicePolicy
): Promise<ContextService> {
  const { resolveContextModules } = await import("../composition/factory");
  const { ContextService } = await import("./ContextService");
  const modules = await resolveContextModules(policy);
  return new ContextService(modules);
}
```

### 3.3 Qué hace el Service

```typescript
// Errores específicos del Service (coordinación)
export class ModuleANotFoundError extends NotFoundError {
  constructor(id: string) { super("ModuleA", id); }
}

export class ModuleAOperationError extends OperationError {
  constructor(operation: string, reason: string) {
    super("ModuleA", operation, reason);
  }
}

export class {Context}Service {
  private readonly _moduleA: ModuleAUseCases;
  private readonly _moduleB: ModuleBUseCases;
  private readonly _moduleARepository: ModuleARepository; // Para queries

  constructor(modules: Resolved{Context}Modules) {
    this._moduleA = modules.moduleA;
    this._moduleB = modules.moduleB;
    this._moduleARepository = modules.moduleARepository;
  }

  // ─── Accessors para operaciones simples ──────────────────
  get moduleA(): ModuleAUseCases { return this._moduleA; }
  get moduleB(): ModuleBUseCases { return this._moduleB; }

  // ─── Workflow que coordina MÚLTIPLES módulos ─────────────
  async complexWorkflow(
    params: WorkflowParams
  ): Promise<Result<ModuleAOperationError | ModuleBError, WorkflowResult>> {
    // 1. Operación en módulo A
    const resultA = await this._moduleA.someUseCase.execute(...);
    if (resultA.isFail()) {
      return Result.fail(new ModuleAOperationError("create", resultA.error.message));
    }

    // 2. Operación en módulo B (usando resultado de A)
    const resultB = await this._moduleB.anotherUseCase.execute({
      ...params,
      dataFromA: resultA.value.someData,
    });
    if (resultB.isFail()) return Result.fail(resultB.error);

    // 3. Actualizar módulo A con resultado de B
    const updateResult = await this._moduleA.updateUseCase.execute({
      id: resultA.value.id,
      newData: resultB.value.computedData,
    });

    return updateResult;
  }
}
```

### 3.4 Qué NO hace un Módulo

Un módulo individual **NUNCA**:
- Importa o referencia otro módulo
- Coordina flujos que involucran otros módulos
- Tiene su propio Service/Orchestrator
- Accede al repository de otro módulo

### 3.5 Context Composition Pattern

```typescript
// composition/factory.ts
export interface ContextServicePolicy {
  provider: "in-memory" | "browser" | "server";
  dbPath?: string;
  dbName?: string;
  configOverrides?: Record<string, string>;
  overrides?: {
    moduleA?: Partial<ModuleAInfrastructurePolicy>;
    moduleB?: Partial<ModuleBInfrastructurePolicy>;
  };
}

export interface ResolvedContextModules {
  moduleA: ModuleAUseCases;
  moduleB: ModuleBUseCases;
  moduleARepository: ModuleARepository; // Para coordinación
}

// ─── Config Resolution ───────────────────────────────────
async function resolveConfig(policy: ContextServicePolicy): Promise<ConfigProvider> {
  if (policy.configOverrides) {
    const { InMemoryConfigProvider } = await import("@shared/config/...");
    return new InMemoryConfigProvider(policy.configOverrides);
  }
  if (policy.provider === "browser") {
    return new InMemoryConfigProvider({});
  }
  const { NodeConfigProvider } = await import("@shared/config/...");
  return new NodeConfigProvider();
}

// ─── Build module policies from context policy ───────────
function buildModuleAPolicy(
  contextPolicy: ContextServicePolicy,
  config: ConfigProvider
): ModuleAInfrastructurePolicy {
  return {
    provider: contextPolicy.overrides?.moduleA?.provider ?? contextPolicy.provider,
    dbPath: contextPolicy.dbPath ?? config.getOrDefault("KLAY_DB_PATH", "./data"),
    dbName: contextPolicy.dbName ?? config.getOrDefault("KLAY_DB_NAME", "klay-db"),
  };
}

// ─── Main resolution ─────────────────────────────────────
export async function resolveContextModules(
  policy: ContextServicePolicy
): Promise<ResolvedContextModules> {
  const config = await resolveConfig(policy);

  const [moduleAResult, moduleBResult] = await Promise.all([
    moduleAFactory(buildModuleAPolicy(policy, config)),
    moduleBFactory(buildModuleBPolicy(policy, config)),
  ]);

  return {
    moduleA: moduleAResult.useCases,
    moduleB: moduleBResult.useCases,
    moduleARepository: moduleAResult.infra.repository, // Para coordinación
  };
}
```

---

## 4. Pipeline Orchestrator (Nivel Cross-Context)

### 4.1 Ubicación y Responsabilidad

El Pipeline existe **al mismo nivel que los contextos**, NO dentro de uno. Es el único punto de coordinación entre Bounded Contexts.

```
klay+/
├── source-ingestion/          ← Bounded Context
├── semantic-knowledge/        ← Bounded Context
├── semantic-processing/       ← Bounded Context
├── knowledge-retrieval/       ← Bounded Context
├── shared/                    ← Shared Kernel
│
└── pipeline/                  ← Pipeline Orchestrator (NO es un Bounded Context)
    ├── index.ts               # API pública del pipeline
    ├── PipelineOrchestrator.ts # Punto de entrada cross-context
    ├── __tests__/
    │   └── e2e.test.ts        # Tests E2E (OBLIGATORIO)
    ├── use-cases/
    │   ├── {Acción}{Dominio}Workflow.ts
    │   └── index.ts
    └── composition/
        ├── index.ts           # Re-exports (OBLIGATORIO)
        ├── infra-policies.ts  # PipelinePolicy, ResolvedPipelineServices
        ├── PipelineComposer.ts
        └── pipeline.factory.ts
```

### 4.2 Qué hace vs Qué NO hace el Pipeline

```
✅ EL PIPELINE HACE                          ❌ EL PIPELINE NO HACE
─────────────────────────────────────────────────────────────────────────
Coordinar services en secuencia              Contener lógica de dominio
Propagar resultados entre pasos              Acceder a repositorios directamente
Envolver errores con contexto de paso        Definir entidades o agregados
Componer services via PipelineComposer       Importar internos de un contexto
Exponer workflows como operaciones           Decidir reglas de negocio
Usar Result<PipelineError, T>                Publicar eventos de dominio
```

### 4.3 Analogía Arquitectónica

La jerarquía de coordinación sigue un patrón fractal:

| Nivel | Coordinador | Coordina | Mediante |
|-------|-------------|----------|----------|
| **Módulo** | Use Case | Aggregate + Ports | Inyección directa |
| **Contexto** | Service | Múltiples Módulos | Module factories |
| **Pipeline** | PipelineOrchestrator | Múltiples Contextos | Context services |

Cada nivel solo conoce la API pública del nivel inferior. Nunca accede a los internos.

### 4.4 Pipeline Policy

```typescript
// composition/infra-policies.ts
export type PipelineInfraPolicy = "in-memory" | "browser" | "server";

export interface PipelinePolicy {
  provider: PipelineInfraPolicy;

  // Configuración global propagada a todos los contextos
  configOverrides?: Record<string, string>;

  // Overrides granulares por contexto (opcional)
  overrides?: {
    ingestion?: Partial<SourceIngestionServicePolicy>;
    knowledge?: Partial<SemanticKnowledgeServicePolicy>;
    processing?: Partial<SemanticProcessingServicePolicy>;
    retrieval?: Partial<KnowledgeRetrievalServicePolicy>;
  };
}

export interface ResolvedPipelineServices {
  ingestion: SourceIngestionService;
  knowledge: SemanticKnowledgeService;
  processing: SemanticProcessingService;
  retrieval: KnowledgeRetrievalService;
}
```

### 4.5 Pipeline Composer

El PipelineComposer instancia services respetando dependencias cross-context. Los contextos independientes se resuelven en paralelo; los contextos con dependencias se resuelven en secuencia.

```typescript
// composition/PipelineComposer.ts
export class PipelineComposer {
  static async resolve(policy: PipelinePolicy): Promise<ResolvedPipelineServices> {
    // 1. Contextos sin dependencias cross-context (paralelo)
    const [ingestion, knowledge] = await Promise.all([
      import("../../source-ingestion/service").then(
        (m) => m.createSourceIngestionService({
          provider: policy.provider,
          ...policy.overrides?.ingestion,
        }),
      ),
      import("../../semantic-knowledge/service").then(
        (m) => m.createSemanticKnowledgeService({
          provider: policy.provider,
          ...policy.overrides?.knowledge,
        }),
      ),
    ]);

    // 2. SemanticProcessing (independiente, pero expone vectorStore)
    const processing = await import("../../semantic-processing/service").then(
      (m) => m.createSemanticProcessingService({
        provider: policy.provider,
        ...policy.overrides?.processing,
      }),
    );

    // 3. KnowledgeRetrieval (depende del vectorStore de processing)
    const retrieval = await import("../../knowledge-retrieval/service").then(
      (m) => m.createKnowledgeRetrievalService({
        provider: policy.provider,
        vectorStoreRef: processing.vectorStore,  // Wiring cross-context
        ...policy.overrides?.retrieval,
      }),
    );

    return { ingestion, knowledge, processing, retrieval };
  }
}
```

### 4.6 Workflow Pattern

Un Workflow es una clase que coordina un flujo cross-context. Recibe services por constructor y expone un método `execute()` que retorna `Result<PipelineError, T>`.

```typescript
// use-cases/IngestDocumentWorkflow.ts
export interface IngestDocumentCommand {
  sourceId: string;
  sourceName: string;
  uri: string;
  sourceType: SourceType;
  extractionJobId: string;
  semanticUnitId: string;
  projectionId: string;
  content: string;
  language: string;
  createdBy: string;
  projectionType: ProjectionType;
}

export interface IngestDocumentSuccess {
  sourceId: string;
  unitId: string;
  projectionId: string;
  chunksCount: number;
}

export class IngestDocumentWorkflow {
  constructor(
    private readonly ingestion: SourceIngestionService,
    private readonly knowledge: SemanticKnowledgeService,
    private readonly processing: SemanticProcessingService,
  ) {}

  async execute(
    command: IngestDocumentCommand,
  ): Promise<Result<PipelineError, IngestDocumentSuccess>> {
    // Paso 1: Ingerir y extraer
    const ingestionResult = await this.ingestion.ingestAndExtract({
      sourceId: command.sourceId,
      sourceName: command.sourceName,
      uri: command.uri,
      type: command.sourceType,
      extractionJobId: command.extractionJobId,
    });

    if (ingestionResult.isFail()) {
      return Result.fail(
        PipelineError.fromStep("ingestion", ingestionResult.error),
      );
    }

    // Paso 2: Crear unidad semántica con lineage
    const knowledgeResult = await this.knowledge.createSemanticUnitWithLineage({
      id: command.semanticUnitId,
      sourceId: command.sourceId,
      sourceType: command.sourceType,
      content: command.content,
      language: command.language,
      createdBy: command.createdBy,
    });

    if (knowledgeResult.isFail()) {
      return Result.fail(
        PipelineError.fromStep("knowledge", knowledgeResult.error, ["ingestion"]),
      );
    }

    // Paso 3: Generar proyección semántica
    const projectionResult = await this.processing.processContent({
      projectionId: command.projectionId,
      semanticUnitId: command.semanticUnitId,
      semanticUnitVersion: 1,
      content: command.content,
      type: command.projectionType,
    });

    if (projectionResult.isFail()) {
      return Result.fail(
        PipelineError.fromStep("processing", projectionResult.error, ["ingestion", "knowledge"]),
      );
    }

    return Result.ok({
      sourceId: command.sourceId,
      unitId: knowledgeResult.value.unitId,
      projectionId: projectionResult.value.projectionId,
      chunksCount: projectionResult.value.chunksCount,
    });
  }
}
```

### 4.7 Pipeline Error

El Pipeline define un tipo de error que envuelve errores de contexto con trazabilidad de paso:

```typescript
export class PipelineError extends DomainError {
  constructor(
    readonly step: string,              // Contexto donde falló
    readonly originalError: DomainError, // Error original del contexto
    readonly completedSteps: string[],  // Pasos exitosos antes del fallo
  ) {
    super(
      `Pipeline failed at step '${step}': ${originalError.message}`,
      "PIPELINE_STEP_FAILED",
      { step, completedSteps },
    );
  }

  static fromStep(
    step: string,
    error: DomainError,
    completed?: string[],
  ): PipelineError {
    return new PipelineError(step, error, completed ?? []);
  }
}
```

### 4.8 Pipeline Orchestrator

```typescript
// PipelineOrchestrator.ts
export class PipelineOrchestrator {
  private readonly _ingestDocument: IngestDocumentWorkflow;
  private readonly _addSourceToUnit: AddSourceToUnitWorkflow;
  private readonly _reprocessKnowledge: ReprocessKnowledgeWorkflow;

  // Expose services for direct access when needed
  private readonly _services: ResolvedPipelineServices;

  constructor(services: ResolvedPipelineServices) {
    this._services = services;
    this._ingestDocument = new IngestDocumentWorkflow(
      services.ingestion, services.knowledge, services.processing,
    );
    this._addSourceToUnit = new AddSourceToUnitWorkflow(
      services.ingestion, services.knowledge, services.processing,
    );
    this._reprocessKnowledge = new ReprocessKnowledgeWorkflow(
      services.knowledge, services.processing,
    );
  }

  // ─── Workflow Operations ──────────────────────────────────
  async ingestDocument(command: IngestDocumentCommand) {
    return this._ingestDocument.execute(command);
  }

  async addSourceToUnit(command: AddSourceToUnitCommand) {
    return this._addSourceToUnit.execute(command);
  }

  async reprocessKnowledge(command: ReprocessKnowledgeCommand) {
    return this._reprocessKnowledge.execute(command);
  }

  // ─── Direct Service Access ────────────────────────────────
  get ingestion(): SourceIngestionService { return this._services.ingestion; }
  get knowledge(): SemanticKnowledgeService { return this._services.knowledge; }
  get processing(): SemanticProcessingService { return this._services.processing; }
  get retrieval(): KnowledgeRetrievalService { return this._services.retrieval; }
}
```

### 4.9 pipeline.ts (Patrón Obligatorio)

```typescript
// pipeline.ts
export { PipelineOrchestrator } from "./PipelineOrchestrator.js";
export { PipelineComposer } from "./composition/PipelineComposer.js";
export { PipelineError } from "./PipelineError.js";
export type {
  PipelinePolicy,
  PipelineInfraPolicy,
  ResolvedPipelineServices,
} from "./composition/infra-policies.js";

// Factory function como API principal
export async function createPipeline(
  policy: PipelinePolicy,
): Promise<PipelineOrchestrator> {
  const { PipelineComposer } = await import("./composition/PipelineComposer.js");
  const { PipelineOrchestrator } = await import("./PipelineOrchestrator.js");
  const services = await PipelineComposer.resolve(policy);
  return new PipelineOrchestrator(services);
}
```

---

## 5. Eventos de Integración

### 5.1 Contratos

Los eventos de integración se definen en `shared/domain/events/IntegrationEvents.ts`. Son DTOs inmutables que constituyen la interfaz pública asíncrona de cada contexto:

```typescript
// Formato de eventType: "{bounded-context}.{module}.{event}" en kebab-case
interface SourceExtractedEvent {
  readonly eventType: "source-ingestion.source.extracted";
  readonly sourceId: string;
  readonly rawContent: string;
  readonly contentHash: string;
}

interface SemanticUnitCreatedEvent {
  readonly eventType: "semantic-knowledge.semantic-unit.created";
  readonly semanticUnitId: string;
  readonly content: string;
  readonly version: number;
}
```

### 5.2 Flujo de Eventos

```
Source Ingestion ──SourceExtracted──▶ Semantic Knowledge
                                          │
                                 SemanticUnitCreated
                                 SemanticUnitVersioned
                                 ReprocessRequested
                                          │
                                          ▼
Knowledge Retrieval ◀──ProjectionGenerated── Semantic Processing
```

### 5.3 Coreografía vs Orquestación

| Aspecto | Orquestación (Pipeline) | Coreografía (Eventos) |
|---|---|---|
| Coordinador | PipelineOrchestrator | Handlers independientes |
| Acoplamiento | Services conocidos por Pipeline | Solo contratos compartidos |
| Trazabilidad | Explícita via `PipelineError.completedSteps` | Requiere correlation IDs |
| Errores | Centralizados en workflow | Distribuidos en handlers |
| Ideal para | Confirmación inmediata | Procesamiento background |

La recomendación es iniciar con orquestación síncrona y evolucionar a coreografía event-driven cuando se requiera procesamiento background.

---

## 6. Reglas Anti-Errores para Agentes

### 6.1 Errores Críticos a Evitar

#### ❌ Detección de Runtime en Adapters

```typescript
// ❌ INCORRECTO - Adapter detecta entorno
export class PdfExtractor implements ContentExtractor {
  async extract(source: Source) {
    if (typeof window !== 'undefined') {  // ❌ NO HACER ESTO
      return this.browserExtract(source);
    } else {
      return this.serverExtract(source);
    }
  }
}

// ✅ CORRECTO - Composer decide, Adapter es específico
// BrowserPdfExtractor.ts - Solo sabe extraer en browser
export class BrowserPdfExtractor implements ContentExtractor {
  async extract(source: Source) {
    // Usa pdfjs-dist, asume contexto browser
  }
}

// ServerPdfExtractor.ts - Solo sabe extraer en server
export class ServerPdfExtractor implements ContentExtractor {
  async extract(source: Source) {
    // Usa pdf-extraction, asume contexto Node
  }
}

// Composer decide cuál usar
private static async resolveExtractor(policy): Promise<ContentExtractor> {
  if (policy.provider === "browser") {
    return new BrowserPdfExtractor();
  }
  return new ServerPdfExtractor();
}
```

#### ❌ Dependencias Cruzadas entre Módulos

```typescript
// ❌ INCORRECTO - Módulo importa otro módulo
// extraction/application/ExecuteExtraction.ts
import { SourceRepository } from "../../source/domain/SourceRepository"; // ❌ NO

// ✅ CORRECTO - Solo el Service coordina
// service/SourceIngestionService.ts
import type { SourceUseCases } from "../source/application";
import type { ExtractionUseCases } from "../extraction/application";

export class SourceIngestionService {
  constructor(modules: { source: SourceUseCases; extraction: ExtractionUseCases }) {}
  // Aquí se coordina
}
```

#### ❌ Dependencias Cruzadas entre Contextos

```typescript
// ❌ INCORRECTO - Contexto importa internos de otro contexto
// knowledge-retrieval/semantic-query/application/QueryUseCase.ts
import { SemanticProjectionRepository } from "../../semantic-processing/projection/domain/..."; // ❌ NO

// ✅ CORRECTO - Solo el Pipeline coordina services
// pipeline/use-cases/IngestDocumentWorkflow.ts
import type { SourceIngestionService } from "../../source-ingestion/service";
import type { SemanticKnowledgeService } from "../../semantic-knowledge/service";

export class IngestDocumentWorkflow {
  constructor(
    private readonly ingestion: SourceIngestionService,  // Solo API pública
    private readonly knowledge: SemanticKnowledgeService, // Solo API pública
  ) {}
}
```

#### ❌ Lógica de Composición Fuera de composition/

```typescript
// ❌ INCORRECTO - Use case decide infraestructura
export class RegisterSource {
  constructor() {
    // ❌ Use case crea su propio repository
    this.repository = process.env.NODE_ENV === 'test'
      ? new InMemoryRepository()
      : new NeDBRepository();
  }
}

// ✅ CORRECTO - Use case recibe dependencias
export class RegisterSource {
  constructor(
    private readonly repository: SourceRepository,  // ✅ Inyectado
    private readonly eventPublisher: EventPublisher, // ✅ Inyectado
  ) {}
}
```

#### ❌ Lógica de Dominio en el Pipeline

```typescript
// ❌ INCORRECTO - Pipeline contiene lógica de negocio
class IngestDocumentWorkflow {
  async execute(command) {
    // ❌ Pipeline validando reglas de dominio
    if (command.content.length < 100) {
      return Result.fail(new ContentTooShortError());
    }
    // ❌ Pipeline calculando hashes
    const hash = crypto.createHash('sha256').update(command.content).digest('hex');
    // ...
  }
}

// ✅ CORRECTO - Pipeline solo coordina
class IngestDocumentWorkflow {
  async execute(command) {
    // ✅ Delega al service, que delega al use case, que valida en dominio
    const result = await this.ingestion.ingestAndExtract({...command});
    if (result.isFail()) return Result.fail(PipelineError.fromStep("ingestion", result.error));
    // ...
  }
}
```

### 6.2 Checklist de Validación

Antes de finalizar un módulo, verificar:

- [ ] ¿El Composer es el ÚNICO que decide implementaciones?
- [ ] ¿Los adapters NO detectan entorno (window, process, etc.)?
- [ ] ¿El módulo NO importa otros módulos del contexto?
- [ ] ¿Los Use Cases reciben TODAS sus dependencias por constructor?
- [ ] ¿La coordinación entre módulos está SOLO en el Service?
- [ ] ¿Factory retorna `{ useCases, infra }`?
- [ ] ¿Existe `composition/index.ts` que re-exporta todo?
- [ ] ¿`composition/factory.ts` del contexto usa ConfigProvider?
- [ ] ¿Existe `service/index.ts` con `create{Context}Service`?
- [ ] ¿Existe `__tests__/e2e.test.ts` para el contexto?

---

## 7. Convenciones de Nombrado

### 7.1 Archivos

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Clase/Interface | PascalCase | `Source.ts`, `SourceRepository.ts` |
| Factory function | camelCase | `source.factory.ts` |
| Políticas | kebab-case | `infra-policies.ts` |
| Errores | `{Module}Errors.ts` | `SourceErrors.ts` |
| Workflow | PascalCase | `IngestDocumentWorkflow.ts` |

### 7.2 Clases y Tipos

| Elemento | Patrón | Ejemplo |
|----------|--------|---------|
| Aggregate Root | `{Name}` | `Source`, `ExtractionJob` |
| Value Object ID | `{Aggregate}Id` | `SourceId`, `ExtractionJobId` |
| Use Case | `{Verb}{Noun}` | `RegisterSource`, `ExecuteExtraction` |
| Error | `{Concept}{Type}Error` | `SourceNotFoundError` |
| Event | `{Aggregate}{PastVerb}` | `SourceRegistered` |
| Composer | `{Module}Composer` | `SourceComposer` |
| Service | `{Context}Service` | `SourceIngestionService` |
| Workflow | `{Verb}{Domain}Workflow` | `IngestDocumentWorkflow` |
| Pipeline Error | `PipelineError` | Único, con `step` discriminante |
| Pipeline Factory | `createPipeline` | API pública del pipeline |

### 7.3 EVENT_TYPE

Formato: `{bounded-context}.{module}.{event}` en kebab-case

```typescript
static readonly EVENT_TYPE = "source-ingestion.source.registered";
static readonly EVENT_TYPE = "source-ingestion.extraction.completed";
```

---

## 8. Patrones de Implementación

### 8.1 Aggregate Root

```typescript
export class {Aggregate} extends AggregateRoot<{Aggregate}Id> {
  private _field: string;

  // Constructor privado
  private constructor(id: {Aggregate}Id, field: string) {
    super(id);
    this._field = field;
  }

  // Solo getters
  get field(): string { return this._field; }

  // Factory para crear
  static create(id: {Aggregate}Id, field: string): {Aggregate} {
    if (!field) throw new Error("Field is required");
    const entity = new {Aggregate}(id, field);
    entity.record({ /* evento */ });
    return entity;
  }

  // Reconstitute para hidratar (sin eventos)
  static reconstitute(id: {Aggregate}Id, field: string): {Aggregate} {
    return new {Aggregate}(id, field);
  }
}
```

### 8.2 Use Case con Result

```typescript
export class {UseCase} {
  constructor(
    private readonly repository: {Aggregate}Repository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: {UseCase}Command): Promise<Result<{Module}Error, {Aggregate}>> {
    // Validar
    if (!command.field) {
      return Result.fail(new FieldRequiredError());
    }

    // Crear/modificar
    const entity = {Aggregate}.create(id, command.field);

    // Persistir
    await this.repository.save(entity);

    // Publicar eventos
    await this.eventPublisher.publishAll(entity.clearEvents());

    // Retornar
    return Result.ok(entity);
  }
}
```

### 8.3 Domain Errors

```typescript
// Errores específicos del módulo
export class {Aggregate}NotFoundError extends NotFoundError {
  constructor(id: string) { super("{Aggregate}", id); }
}

export class {Aggregate}ValidationError extends ValidationError {
  constructor(field: string, reason: string) {
    super("{Aggregate}", field, reason);
  }
}

// Union type
export type {Module}Error =
  | {Aggregate}NotFoundError
  | {Aggregate}ValidationError;
```

### 8.4 Repository Interface (Port)

```typescript
export interface {Aggregate}Repository extends Repository<{Aggregate}, {Aggregate}Id> {
  // Métodos adicionales del dominio
  findByField(field: string): Promise<{Aggregate} | null>;
  exists(id: {Aggregate}Id): Promise<boolean>;
}
```

---

## 9. Flujo de Composición

### 9.1 Nivel Módulo

```
Policy → Composer → Resolved Infra → UseCases Container
```

```typescript
// 1. Política define QUÉ tipo de infra
const policy: SourceInfrastructurePolicy = { provider: "server", dbPath: "./data" };

// 2. Composer resuelve CÓMO implementar
const infra = await SourceComposer.resolve(policy);

// 3. UseCases se construyen con infra resuelta
const useCases = new SourceUseCases(infra.repository, infra.eventPublisher);
```

### 9.2 Nivel Contexto

```
ServicePolicy → resolveModules() → ResolvedModules → Service
```

```typescript
// 1. Política de contexto (hereda a módulos)
const contextPolicy: SourceIngestionServicePolicy = {
  provider: "server",
  dbPath: "./data",
  overrides: {
    extraction: { provider: "browser" }, // Override específico
  },
};

// 2. resolveModules() orquesta la composición
const modules = await resolveSourceIngestionModules(contextPolicy);

// 3. Service recibe módulos ya resueltos
const service = new SourceIngestionService(modules);
```

### 9.3 Nivel Pipeline

```
PipelinePolicy → PipelineComposer → Context Services → Workflows → PipelineOrchestrator
```

```typescript
// 1. Política global (hereda a todos los contextos)
const pipelinePolicy: PipelinePolicy = {
  provider: "in-memory",
  overrides: {
    processing: { embeddingProvider: "hash" },
  },
};

// 2. PipelineComposer instancia services (respetando dependencias)
const services = await PipelineComposer.resolve(pipelinePolicy);

// 3. PipelineOrchestrator ensambla workflows con services resueltos
const pipeline = new PipelineOrchestrator(services);

// 4. Ejecutar flujos cross-context
const result = await pipeline.ingestDocument({ ... });
```

---

## 10. Reglas y Principios

### 10.1 Reglas de Dominio

1. **Constructor privado** + `static create()` + `static reconstitute()`
2. **Solo getters**, nunca setters públicos
3. **Eventos en create/mutate**, nunca en reconstitute
4. **Validaciones** en factory methods

### 10.2 Reglas de Aplicación

1. **Result Pattern**: Use cases retornan `Result<Error, Value>`
2. **Inyección**: Dependencias por constructor
3. **Single Responsibility**: Un use case = una operación sobre UN aggregate

### 10.3 Reglas de Infraestructura

1. **Adapters puros**: NO detectan entorno, solo implementan
2. **DTOs** para serialización
3. **Dynamic imports** en Composers

### 10.4 Reglas de Composición

1. **Composer es obligatorio**, Factory es opcional
2. **Políticas declarativas** (`in-memory`, `browser`, `server`)
3. **Un método por aspecto** (`resolveRepository`, `resolvePublisher`)

### 10.5 Reglas de Contexto

1. **Service solo a nivel de contexto**
2. **Módulos NO se comunican directamente**
3. **Coordinación vía Service o eventos**

### 10.6 Reglas del Pipeline

1. **Pipeline NO es un Bounded Context** — no tiene dominio
2. **Solo invoca services** — nunca repositorios ni use cases directamente
3. **Sin lógica de negocio** — solo coordinación y propagación de resultados
4. **Cada workflow es una clase** — constructor recibe services, `execute()` retorna Result
5. **PipelineError envuelve errores** — preserva `step` y `completedSteps`
6. **Sigue Composición por Políticas** — PipelineComposer resuelve services
7. **Wiring cross-context en el Composer** — e.g., `processing.vectorStore → retrieval`

---

## 11. Checklist para Nuevo Módulo

- [ ] Crear estructura de carpetas
- [ ] Implementar Aggregate Root (constructor privado)
- [ ] Implementar Value Objects
- [ ] Definir Repository interface (port)
- [ ] Definir errores de dominio
- [ ] Implementar eventos de dominio
- [ ] Implementar Use Cases con Result
- [ ] Crear UseCases container
- [ ] Implementar repositorios (InMemory mínimo)
- [ ] **Crear Composer** (obligatorio)
- [ ] **Crear Factory** retornando `{ useCases, infra }`
- [ ] **Crear `composition/index.ts`** (obligatorio)
- [ ] Configurar index.ts del módulo

## 12. Checklist para Nuevo Contexto

- [ ] Crear estructura de contexto
- [ ] Implementar módulos individuales (con factories)
- [ ] **Crear `composition/factory.ts`** con ServicePolicy + resolveModules()
- [ ] **Crear `composition/index.ts`** (obligatorio)
- [ ] Crear Service con errores específicos de coordinación
- [ ] **Crear `service/index.ts`** con `create{Context}Service()`
- [ ] Definir políticas de contexto con `configOverrides`
- [ ] **Escribir `__tests__/e2e.test.ts`** (obligatorio)
- [ ] Configurar index.ts del contexto

## 13. Checklist para Nuevo Workflow

- [ ] Crear `use-cases/{Acción}{Dominio}Workflow.ts`
- [ ] Definir Command interface (entrada del workflow)
- [ ] Definir Success interface (salida exitosa)
- [ ] Constructor recibe services como dependencias
- [ ] `execute()` retorna `Result<PipelineError, Success>`
- [ ] Cada paso invoca service → verifica `isFail()` → propaga con `PipelineError.fromStep()`
- [ ] `completedSteps` acumula pasos exitosos
- [ ] Exportar workflow desde `use-cases/index.ts`
- [ ] Registrar workflow en `PipelineOrchestrator`
- [ ] Agregar tests en `__tests__/e2e.test.ts`

## 14. Checklist para Pipeline Orchestrator

- [ ] Crear estructura `pipeline/` al nivel de los contextos
- [ ] **Crear `composition/infra-policies.ts`** con PipelinePolicy
- [ ] **Crear PipelineComposer** (instancia services en orden correcto)
- [ ] **Crear `composition/pipeline.factory.ts`**
- [ ] **Crear `composition/index.ts`** (obligatorio)
- [ ] Crear `PipelineError` con step + completedSteps
- [ ] Crear `PipelineOrchestrator` con workflows y service accessors
- [ ] Crear `pipeline.ts` con `createPipeline()`
- [ ] Implementar workflows identificados
- [ ] **Escribir `__tests__/e2e.test.ts`** (obligatorio)

---

## 15. Resumen de Archivos Obligatorios

| Nivel | Archivo | Contenido |
|-------|---------|-----------|
| Módulo | `composition/index.ts` | Re-exports de Composer, policies, factory |
| Módulo | `composition/{module}.factory.ts` | Retorna `{ useCases, infra }` |
| Contexto | `composition/factory.ts` | ServicePolicy + resolveModules() |
| Contexto | `composition/index.ts` | Re-exports |
| Contexto | `service/index.ts` | `create{Context}Service()` factory |
| Contexto | `__tests__/e2e.test.ts` | Test E2E completo del contexto |
| Pipeline | `composition/index.ts` | Re-exports de PipelineComposer, policies |
| Pipeline | `index.ts` | `createPipeline()` factory |
| Pipeline | `PipelineOrchestrator.ts` | Workflows + service accessors |
| Pipeline | `PipelineError.ts` | Error con step + completedSteps |
| Pipeline | `__tests__/e2e.test.ts` | Test E2E completo del pipeline |

---

*Skill arquitectónico para klay+ - Última actualización: Febrero 2026*
