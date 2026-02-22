# Frontend Architecture — klay+ Web

## Descripcion

Arquitectura general del frontend de klay+: organizacion feature-based, service layer con dual runtime, state management patterns, y la relacion Astro ↔ React ↔ @klay/core.

---

## 0. Diagrama de Arquitectura

```
┌──────────────────────────────────────────────────────────────────┐
│                        Astro (SSR Shell)                         │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ pages/*.astro │  │ layouts/*.astro   │  │ pages/api/*       │  │
│  │ (routing)     │  │ (HTML shell)     │  │ (REST endpoints)  │  │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬──────────┘  │
│         │                   │                      │             │
│         │    ┌──────────────▼──────────────┐       │             │
│         └───►│  DashboardShell (React)     │       │             │
│              │  client:load hydration      │       │             │
│              └──────────────┬──────────────┘       │             │
│                             │                      │             │
│  ┌──────────────────────────▼──────────────────┐   │             │
│  │          RuntimeModeProvider (Context)        │   │             │
│  │  ┌─────────────┐   ┌─────────────────────┐  │   │             │
│  │  │ server mode │   │ browser mode        │  │   │             │
│  │  │             │   │                     │  │   │             │
│  │  │ ServerPipe  │   │ BrowserPipe         │  │   │             │
│  │  │ lineService │   │ lineService         │  │   │             │
│  │  └──────┬──────┘   └──────────┬──────────┘  │   │             │
│  └─────────┼─────────────────────┼──────────────┘   │             │
│            │                     │                   │             │
│            ▼                     ▼                   │             │
│     fetch(/api/pipeline/*)  import(@klay/core)       │             │
│            │                     │                   │             │
│            └─────────┬───────────┘                   │             │
│                      ▼                               │             │
│         ┌────────────────────────┐                   │             │
│         │ usePipelineAction hook │                   │             │
│         │ (loading/error/data)   │                   │             │
│         └────────────┬───────────┘                   │             │
│                      ▼                               │             │
│         ┌────────────────────────┐                   │             │
│         │   Feature Components   │                   │             │
│         │   (SearchPage, etc.)   │                   │             │
│         └────────────────────────┘                   │             │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                          @klay/core                              │
│  Pipeline → Bounded Contexts → Modules → Domain                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 1. Layers y Dependencias

### 1.1 Capas (de arriba a abajo)

| Capa | Responsabilidad | Archivos |
|------|----------------|----------|
| **Astro Pages** | Routing, SSR, HTML shell | `pages/*.astro` |
| **Layout** | Shell visual (Sidebar, Header, page mounting) | `layouts/`, `components/layout/` |
| **Feature Components** | UI de cada feature con logica de presentacion | `components/features/{feature}/` |
| **Shared Components** | Primitivos UI reutilizables sin logica de negocio | `components/shared/` |
| **Hooks** | Logica de estado reutilizable | `hooks/` |
| **Contexts** | Estado global (runtime mode, service) | `contexts/` |
| **Services** | Abstraccion de comunicacion con @klay/core | `services/` |
| **API Routes** | Endpoints server-side que invocan @klay/core | `pages/api/` |
| **Server** | Singleton del pipeline para SSR | `server/` |

### 1.2 Reglas de Dependencia

```
Astro Pages → Layout → Feature Components → Shared Components
                                          → Hooks
                                          → Contexts
                                          → Services → @klay/core types

API Routes → Server Singleton → @klay/core
```

**Regla critica**: Feature components NUNCA importan @klay/core directamente para ejecutar operaciones. Solo importan types con `import type`.

---

## 2. Feature-Based Organization

### 2.1 Principio

Cada feature es un directorio autocontenido bajo `components/features/`. Contiene todos los componentes React necesarios para esa funcionalidad.

### 2.2 Estructura de una Feature

```
features/{feature}/
├── {Feature}Page.tsx           # Entry point (montado por DashboardShell)
├── {SubComponent}.tsx          # Componentes internos de la feature
├── {SubComponent}.tsx
└── (hooks, utils si es necesario pero generalmente en hooks/ global)
```

### 2.3 Reglas

```
✅ CORRECTO                              ❌ INCORRECTO
───────────────────────────────────────────────────────────────
Feature importa de shared/               Feature importa de otra feature
Feature tiene su propio Page component   Feature reutiliza el Page de otra
Feature usa hooks globales               Feature duplica logica de hooks
Feature es lazy-loaded en DashboardShell Feature se importa estaticamente
```

### 2.4 Comunicacion entre Features

Las features NO se comunican directamente entre si. Si necesitan compartir datos:
1. **Via URL params** — cuando una feature navega a otra
2. **Via Context** — si comparten estado global (ej: RuntimeModeContext)
3. **Via Service** — cada feature consulta el backend independientemente

---

## 3. State Management

### 3.1 Estrategia

klay+ usa **React Context API** para estado global y **hooks locales** para estado de componente. No usa Redux ni state managers externos.

| Tipo de estado | Herramienta | Ejemplo |
|----------------|-------------|---------|
| Runtime mode + service | `RuntimeModeContext` | server/browser toggle |
| Async operation (loading/error/data) | `usePipelineAction` | search, ingest, process |
| Form state | `useState` local | inputs, selects |
| UI state (open/closed, tabs) | `useState` local | modals, tabs activos |

### 3.2 Agregar nuevo estado global

Si se necesita nuevo estado global (poco comun):

```typescript
// 1. Crear contexto en contexts/{Name}Context.tsx
const MyContext = createContext<MyContextValue | null>(null);

// 2. Crear provider
export function MyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialValue);
  return (
    <MyContext.Provider value={{ state, setState }}>
      {children}
    </MyContext.Provider>
  );
}

// 3. Crear hook de acceso
export function useMyContext(): MyContextValue {
  const ctx = useContext(MyContext);
  if (!ctx) throw new Error("useMyContext must be used within MyProvider");
  return ctx;
}

// 4. Wrappear en DashboardShell o RuntimeModeProvider
```

---

## 4. Error Handling

### 4.1 Patron: ServiceResult → usePipelineAction → ErrorDisplay

```
Service retorna ServiceResult<T>
    │
    ├── success: true  → data state → render data
    │
    └── success: false → error state → <ErrorDisplay {...error} />
```

### 4.2 ErrorDisplay Props

```typescript
interface ErrorDisplayProps {
  message: string;
  code: string;
  step?: string;              // Pipeline step donde fallo
  completedSteps?: string[];  // Steps que si completaron
}
```

### 4.3 Niveles de Error

| Nivel | Que muestra | Ejemplo |
|-------|-------------|---------|
| **Field** | Inline en el campo | Validacion de input |
| **Operation** | ErrorDisplay en la feature | Service call fallido |
| **Page** | Full page error state | Service no inicializado |
| **Network** | Toast o banner | Perdida de conexion |

---

## 5. Lazy Loading y Code Splitting

### 5.1 Page-Level Splitting

DashboardShell usa `React.lazy` para cada feature page:

```typescript
const SearchPage = lazy(() =>
  import("../features/search/SearchPage.js").then(m => ({ default: m.SearchPage })),
);
```

### 5.2 Service-Level Splitting

Los services se cargan dinamicamente segun el runtime mode:

```typescript
// Solo se carga el service necesario
if (mode === "server") {
  const { ServerPipelineService } = await import("../services/server-pipeline-service");
} else {
  const { BrowserPipelineService } = await import("../services/browser-pipeline-service");
}
```

### 5.3 Suspense Boundaries

```tsx
<Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>}>
  <PageComponent />
</Suspense>
```

---

## 6. API Routes Architecture

### 6.1 Flujo Server Mode

```
React Component
    → usePipelineAction(service.searchKnowledge)
    → ServerPipelineService._post("/api/pipeline/search", input)
    → Astro API Route (pages/api/pipeline/search.ts)
    → getPipeline() singleton
    → @klay/core pipeline.searchKnowledge(input)
    → ServiceResult<T> response
```

### 6.2 Flujo Browser Mode

```
React Component
    → usePipelineAction(service.searchKnowledge)
    → BrowserPipelineService (imports @klay/core directly)
    → @klay/core UIAdapter.searchKnowledge(input)
    → ServiceResult<T> response
```

### 6.3 Agregar nueva API route

```typescript
// pages/api/pipeline/{operation}.ts
import type { APIRoute } from "astro";
import { getPipeline } from "../../../server/pipeline-singleton";

export const POST: APIRoute = async ({ request }) => {
  try {
    const input = await request.json();
    const pipeline = await getPipeline();
    const result = await pipeline.{operation}(input);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: "Internal server error", code: "INTERNAL_ERROR" },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
```

---

## 7. Checklists

### 7.1 Nueva Feature Completa

- [ ] Directorio `components/features/{feature}/`
- [ ] `{Feature}Page.tsx` como entry point
- [ ] Sub-componentes de la feature
- [ ] Lazy import en `DashboardShell.tsx` (PAGE_COMPONENTS + PAGE_TITLES)
- [ ] Pagina Astro `pages/{feature}.astro`
- [ ] Link en `Sidebar.tsx`
- [ ] Si necesita backend:
  - [ ] Types en @klay/core (Input + Success)
  - [ ] Metodo en `PipelineService` interface
  - [ ] Implementacion en `ServerPipelineService`
  - [ ] Implementacion en `BrowserPipelineService`
  - [ ] API route en `pages/api/pipeline/`

### 7.2 Nuevo Shared Component

- [ ] Archivo en `components/shared/{Name}.tsx`
- [ ] Props tipadas (extends HTML native si aplica)
- [ ] `className` prop pass-through
- [ ] Variantes via props con defaults sensatos
- [ ] Component class en `global.css` si es reutilizable
- [ ] No tiene logica de negocio

### 7.3 Nuevo Hook

- [ ] Archivo en `hooks/use{Name}.ts`
- [ ] Usa `usePipelineService()` o `useRuntimeMode()` si necesita service
- [ ] Retorna objeto tipado con estado + acciones
- [ ] Maneja cleanup en useEffect si es necesario

---

*Skill de arquitectura frontend para klay+ web*
