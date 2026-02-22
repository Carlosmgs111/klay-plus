# Processing Profile — Module

## Responsabilidad

Configuraciones de procesamiento declarativas, versionables y reproducibles. Un profile declara *que* estrategias de chunking y embedding usar, sin importar *como* se implementan. El usuario selecciona explicitamente un profile para cada run, garantizando reproducibilidad.

## Aggregate Root: `ProcessingProfile`

Constructor privado + `create()` / `reconstitute()`.

**Propiedades**:
- `name` — nombre legible del perfil
- `version` — numero de version (auto-incrementa en cada update)
- `chunkingStrategyId` — ID declarativo de estrategia de chunking (ej: `"recursive-512"`)
- `embeddingStrategyId` — ID declarativo de estrategia de embedding (ej: `"ai-sdk-openai"`)
- `configuration` — `Record` (copia inmutable, frozen)
- `status` — `ProfileStatus`
- `createdAt` — timestamp
- Getters: `isActive`, `isDeprecated`

**Ciclo de vida**: `Active` → `Deprecated` (irreversible)

**Comportamientos**:
- `create()` → Active con version 1
- `update(changes)` → incrementa version, emite `ProfileUpdated`
- `deprecate(reason)` → transiciona a Deprecated (irreversible, no permite mas updates)

**Invariantes**:
- No se puede modificar despues de deprecacion
- Version auto-incrementa en cada update
- Configuration es inmutable (frozen)
- Strategy IDs son declarativos — se resuelven en runtime por el Materializer

## Value Objects

| Value Object | Descripcion |
|-------------|-------------|
| `ProcessingProfileId` | Identidad unica |
| `ProfileStatus` | Enum: `Active`, `Deprecated` |

## Eventos de Dominio

| Evento | Significado |
|--------|-------------|
| `ProfileCreated` | Perfil creado (lleva name, strategyIds, version) |
| `ProfileUpdated` | Perfil actualizado (lleva campos actualizados, version incrementada) |
| `ProfileDeprecated` | Perfil retirado (lleva reason, version final) |

## Use Cases

| Use Case | Descripcion |
|----------|-------------|
| `CreateProcessingProfile` | Crea un nuevo perfil de procesamiento |
| `UpdateProcessingProfile` | Actualiza y versiona un perfil existente |
| `DeprecateProcessingProfile` | Depreca un perfil (irreversible) |

## Port

`ProcessingProfileRepository` — CRUD + `findActiveById(id)` (solo perfiles activos)

## Implementaciones de Persistencia

| Implementacion | Entorno |
|---------------|---------|
| `InMemoryProcessingProfileRepository` | Testing/desarrollo |
| `IndexedDBProcessingProfileRepository` | Browser |
| `NeDBProcessingProfileRepository` | Server |

## Ejemplo

```typescript
ProcessingProfile {
  id: "prof-123",
  name: "Default Semantic Processing",
  version: 2,
  chunkingStrategyId: "recursive-512",
  embeddingStrategyId: "ai-sdk-openai",
  configuration: { overlap: 50, minChunkSize: 100 },
  status: Active
}
```

## Nota sobre Declaratividad

Los `strategyIds` son strings opacos para el dominio. La resolucion a instancias concretas ocurre en la capa de composicion via `ProcessingProfileMaterializer`, que usa `ChunkerFactory` y los providers de embedding registrados.
