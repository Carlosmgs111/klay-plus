# Plugin System Architecture

## Descripcion

Patrones para disenar sistemas de plugins con registries inmutables, provider contracts, lifecycle management y aislamiento. Alineado con el modelo de registry + providers de klay+. Aplicable a TypeScript/Node.js.

---

## 0. Anatomia de un Plugin System

```
┌──────────────────────────────────────────────────────────────┐
│                      HOST APPLICATION                        │
│                                                              │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │ Plugin Registry │  │ Plugin Manager  │  │ Extension     │  │
│  │                │  │                 │  │ Points (Slots)│  │
│  │ - Catalog      │  │ - Discovery     │  │               │  │
│  │ - Resolution   │  │ - Validation    │  │ - Channels    │  │
│  │ - Immutable    │  │ - Loading       │  │ - Providers   │  │
│  │   snapshots    │  │ - Lifecycle     │  │ - Strategies  │  │
│  └───────┬────────┘  └────────┬────────┘  └──────┬───────┘  │
│          │                    │                   │          │
│          └────────────────────┼───────────────────┘          │
│                               │                              │
│  ┌────────────────────────────▼────────────────────────────┐ │
│  │              Plugin Contract (Interface)                 │ │
│  │  - Type-safe contract shared between host and plugins   │ │
│  │  - Versioned for backward compatibility                 │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
         │              │              │
    ┌────▼───┐    ┌────▼───┐    ┌────▼───┐
    │Plugin A│    │Plugin B│    │Plugin C│
    │        │    │        │    │        │
    │Implements   │Implements   │Implements
    │Contract │    │Contract │    │Contract │
    └────────┘    └────────┘    └────────┘
```

---

## 1. Plugin Contract (Interfaz de Extension)

### 1.1 Definicion

El contrato define **que** debe implementar un plugin. Es la interfaz minima y estable que comparten host y plugins.

### 1.2 Reglas de Diseno de Contratos

1. **Minimos** — solo lo estrictamente necesario
2. **Versionados** — incluir version para compatibilidad
3. **Inmutables** — nunca modificar contratos existentes, crear nuevas versiones
4. **En paquete separado** — ni en host ni en plugin, en un shared contracts package
5. **Interfaces + DTOs simples** — no exponer tipos internos del host

### 1.3 Patron Base

```typescript
// ── contracts/plugin.ts ───────────────────────────
export interface PluginManifest {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly requiredContractVersion: string;
  readonly capabilities: PluginCapability[];
}

export type PluginCapability =
  | "embedding"
  | "chunking"
  | "extraction"
  | "storage"
  | "ranking";

export interface Plugin<TConfig = unknown> {
  readonly manifest: PluginManifest;

  // Lifecycle hooks
  initialize?(config: TConfig): Promise<void>;
  shutdown?(): Promise<void>;
  healthCheck?(): Promise<PluginHealth>;
}

export interface PluginHealth {
  readonly status: "healthy" | "degraded" | "unhealthy";
  readonly message?: string;
  readonly lastChecked: Date;
}
```

### 1.4 Contratos Tipados por Capability

```typescript
// ── contracts/embedding-plugin.ts ─────────────────
export interface EmbeddingPlugin extends Plugin<EmbeddingConfig> {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  readonly dimensions: number;
  readonly modelName: string;
}

export interface EmbeddingConfig {
  readonly modelId: string;
  readonly apiKey?: string;
  readonly batchSize?: number;
}

// ── contracts/chunking-plugin.ts ──────────────────
export interface ChunkingPlugin extends Plugin<ChunkingConfig> {
  chunk(content: string): Promise<Chunk[]>;
  readonly strategy: ChunkingStrategy;
}

export interface Chunk {
  readonly content: string;
  readonly index: number;
  readonly metadata: Record<string, unknown>;
}

// ── contracts/extraction-plugin.ts ────────────────
export interface ExtractionPlugin extends Plugin<ExtractionConfig> {
  canExtract(source: SourceDescriptor): boolean;
  extract(source: SourceDescriptor): Promise<ExtractionResult>;
  readonly supportedTypes: string[];
}
```

---

## 2. Plugin Registry (Catalogo Inmutable)

### 2.1 Definicion

El Registry mantiene un **catalogo inmutable** de plugins registrados. Cada registro crea un nuevo snapshot; nunca se modifica el estado existente.

### 2.2 Patron: Immutable Registry

```typescript
export class PluginRegistry<T extends Plugin> {
  private readonly _plugins: ReadonlyMap<string, RegistryEntry<T>>;

  private constructor(plugins: Map<string, RegistryEntry<T>>) {
    this._plugins = new Map(plugins); // Defensive copy
  }

  // ── Factory: crear registry vacio ───────────────
  static empty<T extends Plugin>(): PluginRegistry<T> {
    return new PluginRegistry(new Map());
  }

  // ── Registrar: retorna NUEVO registry (inmutable) ─
  register(plugin: T): Result<RegistryError, PluginRegistry<T>> {
    const name = plugin.manifest.name;

    // Validar no duplicado
    if (this._plugins.has(name)) {
      return Result.fail(new DuplicatePluginError(name));
    }

    // Validar version de contrato
    if (!this.isCompatible(plugin.manifest.requiredContractVersion)) {
      return Result.fail(new IncompatibleVersionError(name, plugin.manifest.requiredContractVersion));
    }

    // Crear nuevo registry con el plugin agregado
    const newPlugins = new Map(this._plugins);
    newPlugins.set(name, {
      plugin,
      registeredAt: new Date(),
      status: "registered",
    });

    return Result.ok(new PluginRegistry(newPlugins));
  }

  // ── Resolver plugin por nombre ──────────────────
  resolve(name: string): T | null {
    const entry = this._plugins.get(name);
    return entry?.plugin ?? null;
  }

  // ── Listar todos ────────────────────────────────
  list(): readonly RegistryEntry<T>[] {
    return [...this._plugins.values()];
  }

  // ── Filtrar por capability ──────────────────────
  findByCapability(capability: PluginCapability): T[] {
    return [...this._plugins.values()]
      .filter(entry => entry.plugin.manifest.capabilities.includes(capability))
      .map(entry => entry.plugin);
  }

  // ── Version check ───────────────────────────────
  private isCompatible(requiredVersion: string): boolean {
    // semver compatibility check
    return satisfies(CURRENT_CONTRACT_VERSION, `>=${requiredVersion}`);
  }

  get size(): number { return this._plugins.size; }
}

interface RegistryEntry<T> {
  readonly plugin: T;
  readonly registeredAt: Date;
  readonly status: "registered" | "initialized" | "failed";
}
```

### 2.3 Uso Inmutable

```typescript
// Cada operacion retorna un NUEVO registry
let registry = PluginRegistry.empty<EmbeddingPlugin>();

const result1 = registry.register(new OpenAIEmbeddingPlugin());
if (result1.isOk()) registry = result1.value;

const result2 = registry.register(new LocalEmbeddingPlugin());
if (result2.isOk()) registry = result2.value;

// El registry original no fue modificado
// Cada paso es un snapshot inmutable
```

---

## 3. Provider Pattern

### 3.1 Definicion

Un Provider es una **abstraccion que selecciona y configura** el plugin adecuado para un contexto dado. Es el puente entre el registry y los consumidores.

### 3.2 Patron

```typescript
// ── Provider Interface ────────────────────────────
export interface EmbeddingProvider {
  getEmbedder(context?: ProviderContext): EmbeddingPlugin;
}

export interface ProviderContext {
  readonly preferredModel?: string;
  readonly environment?: "browser" | "server";
  readonly costSensitive?: boolean;
}

// ── Provider Implementation ───────────────────────
export class RegistryBasedEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private readonly registry: PluginRegistry<EmbeddingPlugin>,
    private readonly defaultPlugin: string,
    private readonly selectionStrategy: PluginSelectionStrategy,
  ) {}

  getEmbedder(context?: ProviderContext): EmbeddingPlugin {
    if (context?.preferredModel) {
      const specific = this.registry.resolve(context.preferredModel);
      if (specific) return specific;
    }

    // Strategy-based selection
    const candidates = this.registry.findByCapability("embedding");
    if (candidates.length === 0) {
      throw new NoPluginAvailableError("embedding");
    }

    return this.selectionStrategy.select(candidates, context);
  }
}
```

### 3.3 Selection Strategies

```typescript
export interface PluginSelectionStrategy {
  select<T extends Plugin>(candidates: T[], context?: ProviderContext): T;
}

// ── Estrategia: Prioridad fija ────────────────────
export class PrioritySelectionStrategy implements PluginSelectionStrategy {
  constructor(private readonly priorityOrder: string[]) {}

  select<T extends Plugin>(candidates: T[]): T {
    for (const name of this.priorityOrder) {
      const match = candidates.find(c => c.manifest.name === name);
      if (match) return match;
    }
    return candidates[0]; // fallback al primero
  }
}

// ── Estrategia: Por environment ───────────────────
export class EnvironmentSelectionStrategy implements PluginSelectionStrategy {
  select<T extends Plugin>(candidates: T[], context?: ProviderContext): T {
    if (context?.environment === "browser") {
      const browserPlugin = candidates.find(c =>
        c.manifest.capabilities.includes("browser-compatible" as any)
      );
      if (browserPlugin) return browserPlugin;
    }
    return candidates[0];
  }
}
```

---

## 4. Lifecycle Management

### 4.1 Fases del Lifecycle

```
  Discovery → Validation → Registration → Initialization → Runtime → Shutdown
       │           │              │              │            │          │
       │     Schema check    Add to          Call           Active    Call
       │     Version check   Registry      initialize()    usage   shutdown()
       │     Deps check                                             Cleanup
       │
  Scan for plugins
  (filesystem, config, etc)
```

### 4.2 Plugin Manager

```typescript
export class PluginManager<T extends Plugin> {
  private registry: PluginRegistry<T>;
  private readonly validators: PluginValidator[];

  constructor(
    private readonly contractVersion: string,
    validators?: PluginValidator[],
  ) {
    this.registry = PluginRegistry.empty<T>();
    this.validators = validators ?? [new DefaultPluginValidator()];
  }

  // ── Phase 1: Validate ───────────────────────────
  private validate(plugin: T): Result<ValidationError[], void> {
    const errors: ValidationError[] = [];

    for (const validator of this.validators) {
      const result = validator.validate(plugin);
      if (result.isFail()) errors.push(...result.error);
    }

    return errors.length > 0
      ? Result.fail(errors)
      : Result.ok();
  }

  // ── Phase 2: Register ──────────────────────────
  register(plugin: T): Result<RegistryError | ValidationError[], void> {
    // Validate first
    const validation = this.validate(plugin);
    if (validation.isFail()) return validation;

    // Register in immutable registry
    const result = this.registry.register(plugin);
    if (result.isFail()) return Result.fail(result.error);

    this.registry = result.value;
    return Result.ok();
  }

  // ── Phase 3: Initialize ─────────────────────────
  async initializeAll(configs: Map<string, unknown>): Promise<InitializationReport> {
    const report: InitializationReport = { succeeded: [], failed: [] };

    for (const entry of this.registry.list()) {
      const plugin = entry.plugin;
      const config = configs.get(plugin.manifest.name);

      try {
        if (plugin.initialize) {
          await plugin.initialize(config);
        }
        report.succeeded.push(plugin.manifest.name);
      } catch (error) {
        report.failed.push({
          name: plugin.manifest.name,
          error: error instanceof Error ? error.message : String(error),
        });
        // Plugin falla, pero el sistema continua
        console.error(`Plugin ${plugin.manifest.name} failed to initialize:`, error);
      }
    }

    return report;
  }

  // ── Phase 4: Shutdown ───────────────────────────
  async shutdownAll(): Promise<void> {
    const shutdownPromises = this.registry.list().map(async (entry) => {
      try {
        if (entry.plugin.shutdown) {
          await entry.plugin.shutdown();
        }
      } catch (error) {
        // Log but don't fail — graceful shutdown
        console.error(`Plugin ${entry.plugin.manifest.name} failed to shutdown:`, error);
      }
    });

    await Promise.allSettled(shutdownPromises);
  }

  // ── Access ──────────────────────────────────────
  getRegistry(): PluginRegistry<T> {
    return this.registry;
  }
}

interface InitializationReport {
  succeeded: string[];
  failed: Array<{ name: string; error: string }>;
}
```

---

## 5. Aislamiento y Tolerancia a Fallos

### 5.1 Principio

Un plugin que falla **NO debe tumbar** al host ni a otros plugins. El sistema debe degradar gracefully.

### 5.2 Patrones de Aislamiento

```typescript
// ── Patron: Safe Execution Wrapper ────────────────
export class SafePluginExecutor<T extends Plugin> {
  constructor(
    private readonly plugin: T,
    private readonly fallback?: T,
    private readonly logger?: Logger,
  ) {}

  async execute<R>(
    operation: string,
    fn: (plugin: T) => Promise<R>,
    fallbackValue?: R,
  ): Promise<Result<PluginExecutionError, R>> {
    try {
      const result = await fn(this.plugin);
      return Result.ok(result);
    } catch (error) {
      this.logger?.error(`Plugin ${this.plugin.manifest.name} failed at ${operation}:`, error);

      // Intentar fallback
      if (this.fallback) {
        try {
          const fallbackResult = await fn(this.fallback);
          this.logger?.warn(`Used fallback for ${operation}`);
          return Result.ok(fallbackResult);
        } catch (fallbackError) {
          this.logger?.error(`Fallback also failed:`, fallbackError);
        }
      }

      // Retornar valor por defecto o error
      if (fallbackValue !== undefined) {
        return Result.ok(fallbackValue);
      }

      return Result.fail(new PluginExecutionError(
        this.plugin.manifest.name,
        operation,
        error instanceof Error ? error.message : String(error),
      ));
    }
  }
}

// ── Uso ───────────────────────────────────────────
const safeEmbedder = new SafePluginExecutor(
  primaryEmbedder,
  hashFallbackEmbedder,  // Si el primary falla, usar hash
  logger,
);

const result = await safeEmbedder.execute(
  "embed",
  (plugin) => plugin.embed("some text"),
);
```

### 5.3 Circuit Breaker para Plugins

```typescript
export class PluginCircuitBreaker<T extends Plugin> {
  private failures = 0;
  private lastFailure?: Date;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private readonly plugin: T,
    private readonly threshold: number = 3,
    private readonly resetTimeMs: number = 30000,
  ) {}

  async execute<R>(fn: (plugin: T) => Promise<R>): Promise<Result<CircuitBreakerError, R>> {
    if (this.state === "open") {
      // Check if enough time has passed to try again
      if (Date.now() - (this.lastFailure?.getTime() ?? 0) > this.resetTimeMs) {
        this.state = "half-open";
      } else {
        return Result.fail(new CircuitBreakerError(
          this.plugin.manifest.name,
          "Circuit is open — plugin temporarily disabled",
        ));
      }
    }

    try {
      const result = await fn(this.plugin);
      if (this.state === "half-open") {
        this.state = "closed";
        this.failures = 0;
      }
      return Result.ok(result);
    } catch (error) {
      this.failures++;
      this.lastFailure = new Date();
      if (this.failures >= this.threshold) {
        this.state = "open";
      }
      return Result.fail(new CircuitBreakerError(
        this.plugin.manifest.name,
        error instanceof Error ? error.message : String(error),
      ));
    }
  }

  get currentState(): string { return this.state; }
}
```

---

## 6. Dependency Between Plugins

### 6.1 Declaracion de Dependencias

```typescript
export interface PluginManifest {
  readonly name: string;
  readonly version: string;
  readonly dependencies?: PluginDependency[];
}

export interface PluginDependency {
  readonly name: string;            // Plugin requerido
  readonly versionRange: string;    // Rango semver compatible
  readonly optional?: boolean;      // Si es opcional, no falla si no existe
}
```

### 6.2 Resolucion Topologica

```typescript
export class DependencyResolver {
  resolve(plugins: Plugin[]): Result<DependencyError, Plugin[]> {
    const graph = this.buildGraph(plugins);
    const cycles = this.detectCycles(graph);

    if (cycles.length > 0) {
      return Result.fail(new CyclicDependencyError(cycles));
    }

    // Topological sort — plugins se inicializan en orden correcto
    return Result.ok(this.topologicalSort(graph));
  }

  private buildGraph(plugins: Plugin[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    for (const plugin of plugins) {
      const deps = (plugin.manifest.dependencies ?? [])
        .filter(d => !d.optional)
        .map(d => d.name);
      graph.set(plugin.manifest.name, deps);
    }
    return graph;
  }

  private detectCycles(graph: Map<string, string[]>): string[][] {
    // Kahn's algorithm or DFS-based cycle detection
    // Returns arrays of cycle participants
    // ...
  }

  private topologicalSort(graph: Map<string, string[]>): Plugin[] {
    // Returns plugins in dependency order
    // ...
  }
}
```

---

## 7. Versionado y Compatibilidad

### 7.1 Contract Versioning

```typescript
// El host declara la version de contrato que soporta
const HOST_CONTRACT_VERSION = "2.0.0";

// Cada plugin declara la version minima que necesita
const plugin: PluginManifest = {
  name: "my-embedder",
  version: "1.3.0",
  requiredContractVersion: "^1.5.0",  // Semver range
  capabilities: ["embedding"],
};

// El registry verifica compatibilidad al registrar
if (!semver.satisfies(HOST_CONTRACT_VERSION, plugin.requiredContractVersion)) {
  return Result.fail(new IncompatibleVersionError(plugin.name));
}
```

### 7.2 Breaking Changes Policy

| Cambio | Es breaking? | Accion |
|--------|-------------|--------|
| Agregar metodo opcional al contrato | No | Bump minor |
| Agregar parametro opcional a metodo existente | No | Bump minor |
| Cambiar tipo de retorno | Si | Bump major, crear nuevo contrato |
| Remover metodo del contrato | Si | Bump major, deprecate primero |
| Agregar campo requerido a DTO | Si | Bump major |

---

## 8. Testing de Plugins

### 8.1 Contract Tests

```typescript
// ── Test que TODO embedding plugin debe pasar ─────
export function embeddingPluginContractTests(
  createPlugin: () => EmbeddingPlugin,
) {
  describe("EmbeddingPlugin Contract", () => {
    let plugin: EmbeddingPlugin;

    beforeEach(() => {
      plugin = createPlugin();
    });

    it("should have a valid manifest", () => {
      expect(plugin.manifest.name).toBeTruthy();
      expect(plugin.manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(plugin.manifest.capabilities).toContain("embedding");
    });

    it("should return embeddings with correct dimensions", async () => {
      const result = await plugin.embed("test text");
      expect(result).toHaveLength(plugin.dimensions);
      expect(result.every(v => typeof v === "number")).toBe(true);
    });

    it("should handle empty text", async () => {
      const result = await plugin.embed("");
      expect(result).toHaveLength(plugin.dimensions);
    });

    it("should handle batch embedding", async () => {
      const results = await plugin.embedBatch(["text 1", "text 2", "text 3"]);
      expect(results).toHaveLength(3);
      results.forEach(r => expect(r).toHaveLength(plugin.dimensions));
    });

    it("should initialize and shutdown cleanly", async () => {
      if (plugin.initialize) await plugin.initialize({});
      if (plugin.shutdown) await plugin.shutdown();
    });
  });
}

// ── Cada implementacion ejecuta los contract tests ─
describe("OpenAIEmbeddingPlugin", () => {
  embeddingPluginContractTests(() => new OpenAIEmbeddingPlugin());
});

describe("HashEmbeddingPlugin", () => {
  embeddingPluginContractTests(() => new HashEmbeddingPlugin());
});
```

---

## 9. Integracion con Composition

### 9.1 Plugin System en el Composer

```typescript
export class ProcessingComposer {
  private static async resolveEmbeddingPlugin(
    policy: ProcessingPolicy,
  ): Promise<EmbeddingPlugin> {
    // 1. Crear manager
    const manager = new PluginManager<EmbeddingPlugin>("2.0.0");

    // 2. Registrar plugins segun policy
    switch (policy.embeddingProvider) {
      case "openai": {
        const { OpenAIEmbeddingPlugin } = await import("../plugins/OpenAIEmbeddingPlugin");
        manager.register(new OpenAIEmbeddingPlugin());
        break;
      }
      case "hash": {
        const { HashEmbeddingPlugin } = await import("../plugins/HashEmbeddingPlugin");
        manager.register(new HashEmbeddingPlugin());
        break;
      }
      case "local": {
        const { LocalEmbeddingPlugin } = await import("../plugins/LocalEmbeddingPlugin");
        manager.register(new LocalEmbeddingPlugin());
        break;
      }
    }

    // 3. Inicializar
    const configs = new Map([[policy.embeddingProvider, policy.embeddingConfig]]);
    await manager.initializeAll(configs);

    // 4. Resolver el plugin
    const plugin = manager.getRegistry().resolve(policy.embeddingProvider);
    if (!plugin) throw new Error(`Plugin ${policy.embeddingProvider} not found after registration`);

    return plugin;
  }

  static async resolve(policy: ProcessingPolicy): Promise<ResolvedProcessingInfra> {
    const [embeddingPlugin, chunkingPlugin, vectorStore] = await Promise.all([
      this.resolveEmbeddingPlugin(policy),
      this.resolveChunkingPlugin(policy),
      this.resolveVectorStore(policy),
    ]);

    return { embeddingPlugin, chunkingPlugin, vectorStore };
  }
}
```

---

## 10. Checklist: Diseno de Plugin System

### Para el Host
- [ ] Contrato minimo definido como interfaz TypeScript?
- [ ] Contrato versionado con semver?
- [ ] Contrato en paquete separado (no en host ni en plugin)?
- [ ] Registry inmutable (registro retorna nuevo snapshot)?
- [ ] Plugin Manager maneja lifecycle completo (validate → register → init → shutdown)?
- [ ] Aislamiento: un plugin que falla no tumba al host?
- [ ] Fallback strategy configurada?
- [ ] Contract tests que toda implementacion debe pasar?

### Para cada Plugin
- [ ] Implementa el contrato minimo?
- [ ] Declara manifest con nombre, version, capabilities?
- [ ] Declara dependencias si las tiene?
- [ ] initialize() y shutdown() implementados si necesita recursos?
- [ ] Pasa los contract tests del host?
- [ ] No accede a internos del host (solo contrato publico)?

### Anti-patrones
| Anti-patron | Problema | Solucion |
|-------------|----------|----------|
| **Fat contract** | Demasiados metodos obligatorios | Mantener contrato minimo, usar capabilities para features opcionales |
| **Mutable registry** | Condiciones de carrera, estado impredecible | Registry inmutable, cada operacion retorna nuevo snapshot |
| **Plugin knows host** | Acoplamiento bidireccional | Plugin solo conoce el contrato, nunca importa del host |
| **No fallback** | Un plugin down tumba toda la feature | SafeExecutor + fallback plugin |
| **Unversioned contract** | Breaking changes rompen todos los plugins | Semver en contratos, compatibility check en registro |
| **Singleton plugin** | No se puede testear ni reemplazar | Instancias inyectadas, nunca globals |

---

*Skill de Plugin System Architecture — Alineada con el modelo registry+provider de klay+*
