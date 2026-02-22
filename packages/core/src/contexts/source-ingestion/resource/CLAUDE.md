# Resource — Module

## Responsabilidad

Representa un archivo fisico o referencia externa. Gestiona upload a storage providers y el ciclo de vida del recurso. A diferencia de Source (referencia logica), Resource es la representacion del artefacto fisico.

## Aggregate Root: `Resource`

Metodos factory: `Resource.store()` (upload), `Resource.reference()` (referencia externa), `Resource.reconstitute()` (hidratacion).

**Propiedades**:
- `originalName` — nombre original del archivo
- `mimeType` — tipo MIME
- `size` — tamano en bytes
- `status` — `ResourceStatus`
- `storageLocation` — `StorageLocation | null`
- `createdAt` — timestamp de creacion
- Getters: `isStored`, `isDeleted`, `storageUri`, `provider`

**Ciclo de vida**: `Pending` → `Stored` / `Failed` / `Deleted`

## Value Objects

| Value Object | Descripcion |
|-------------|-------------|
| `ResourceId` | Identidad unica |
| `ResourceStatus` | Enum: `Pending`, `Stored`, `Failed`, `Deleted` |
| `StorageLocation` | `uri` + `provider` (destino de almacenamiento) |

## Eventos de Dominio

| Evento | Significado |
|--------|-------------|
| `ResourceStored` | Archivo subido o referencia externa registrada |
| `ResourceDeleted` | Recurso eliminado |

## Use Cases

| Use Case | Descripcion |
|----------|-------------|
| `StoreResource` | Sube buffer de archivo a storage, crea resource |
| `RegisterExternalResource` | Registra referencia URI externa (sin upload) |
| `DeleteResource` | Marca recurso como eliminado |
| `GetResource` | Recupera un resource |

## Ports

| Port | Responsabilidad |
|------|----------------|
| `ResourceRepository` | CRUD + `findByStatus`, `exists` |
| `ResourceStorage` | `upload`, `delete`, `exists` |

## Implementaciones

### Storage
| Implementacion | Entorno |
|---------------|---------|
| `InMemoryResourceStorage` | Testing/desarrollo |
| `LocalFileResourceStorage` | Server (filesystem local) |

### Repository
| Implementacion | Entorno |
|---------------|---------|
| `InMemoryResourceRepository` | Testing/desarrollo |
| `IndexedDBResourceRepository` | Browser |
| `NeDBResourceRepository` | Server |
