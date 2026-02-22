# Source — Module

## Responsabilidad

Representa una referencia logica a una fuente de contenido externo. **No almacena contenido** — solo metadata, tipo y tracking de versiones via content hash. Es el registro de que un contenido existe y de donde proviene.

## Aggregate Root: `Source`

Constructor privado + `create()` / `reconstitute()`.

**Propiedades**:
- `name` — nombre legible del source
- `type` — `SourceType` (PDF, WEB, API, PLAIN_TEXT, MARKDOWN, CSV, JSON)
- `uri` — referencia al contenido (ruta, URL, etc.)
- `currentVersion` — `SourceVersion | null`
- `versions` — historial de `SourceVersion[]`
- `registeredAt` — timestamp de registro
- `hasBeenExtracted` — getter derivado

**Ciclo de vida**: Registrado (sin extraccion) → Extraido (con content hash).

## Value Objects

| Value Object | Descripcion |
|-------------|-------------|
| `SourceId` | Identidad unica |
| `SourceType` | Enum: `PDF`, `WEB`, `API`, `PLAIN_TEXT`, `MARKDOWN`, `CSV`, `JSON` |
| `SourceVersion` | Snapshot inmutable de version via content hash |

## Eventos de Dominio

| Evento | Significado |
|--------|-------------|
| `SourceRegistered` | Nueva referencia de source creada |
| `SourceUpdated` | Content hash cambio (nueva extraccion detectada) |
| `SourceExtracted` | Extraccion completada para este source |

## Use Cases

| Use Case | Descripcion |
|----------|-------------|
| `RegisterSource` | Registra una referencia sin extraer contenido |
| `UpdateSource` | Actualiza metadata del source |

## Port

`SourceRepository` — `save`, `findById`, `delete`, `findByType`, `findByUri`, `exists`

## Implementaciones de Persistencia

| Implementacion | Entorno |
|---------------|---------|
| `InMemorySourceRepository` | Testing/desarrollo |
| `IndexedDBSourceRepository` | Browser |
| `NeDBSourceRepository` | Server |

## Nota de Diseno

Source es un aggregate de referencia pura. El texto extraido vive en `ExtractionJob` (modulo extraction), no aqui. Source solo trackea *que* se extrajo via content hash en `SourceVersion`.
