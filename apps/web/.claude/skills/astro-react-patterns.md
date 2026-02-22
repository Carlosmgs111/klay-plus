# Astro + React Patterns — klay+ Web

## Descripcion

Patrones y convenciones para el frontend de klay+: Astro 5 como meta-framework SSR, React 19 para componentes interactivos, y la integracion con @klay/core via dual-runtime (server/browser).

---

## 0. Stack Tecnologico

| Aspecto | Tecnologia |
|---------|-----------|
| Meta Framework | Astro 5.7 (SSR, standalone Node adapter) |
| UI Library | React 19 |
| Styling | Tailwind CSS 3.4 |
| Language | TypeScript 5.4 |
| Core Integration | @klay/core (workspace package) |
| Package Manager | pnpm workspaces |
| Build Tool | Vite (via Astro) |

---

## 1. Estructura del Proyecto

```
apps/web/
├── src/
│   ├── components/
│   │   ├── features/           # Componentes por feature (domain-specific)
│   │   │   ├── dashboard/      # DashboardPage.tsx
│   │   │   ├── documents/      # DocumentList, DocumentsPage, DocumentUploadForm
│   │   │   ├── knowledge/      # KnowledgePage, ManifestDetail, SemanticUnitsList
│   │   │   ├── profiles/       # CreateProfileForm, ProfilesPage
│   │   │   ├── search/         # SearchBar, SearchPage, SearchResultCard, SearchResults
│   │   │   └── settings/       # SettingsPage
│   │   ├── layout/             # Shell components
│   │   │   ├── DashboardShell.tsx   # Main shell con Sidebar + Header + page routing
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── shared/             # Componentes UI reutilizables
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── DataTable.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ErrorDisplay.tsx
│   │       ├── Input.tsx
│   │       ├── MetricCard.tsx
│   │       ├── Select.tsx
│   │       ├── Spinner.tsx
│   │       └── StatusBadge.tsx
│   ├── pages/                  # Astro pages + API routes
│   │   ├── api/pipeline/       # REST endpoints (server-side)
│   │   ├── dashboard.astro
│   │   ├── documents.astro
│   │   ├── knowledge.astro
│   │   ├── profiles.astro
│   │   ├── search.astro
│   │   ├── settings.astro
│   │   └── index.astro
│   ├── layouts/
│   │   └── DashboardLayout.astro
│   ├── contexts/
│   │   └── RuntimeModeContext.tsx
│   ├── hooks/
│   │   └── usePipelineAction.ts
│   ├── services/
│   │   ├── pipeline-service.ts       # Interface
│   │   ├── server-pipeline-service.ts # Implementacion server (fetch)
│   │   ├── browser-pipeline-service.ts # Implementacion browser (direct import)
│   │   └── types.ts
│   ├── server/
│   │   └── pipeline-singleton.ts
│   └── styles/
│       └── global.css
├── astro.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 2. Modelo Astro + React: Responsabilidades

### 2.1 Astro es el Shell

Astro controla:
- **Routing** (pages/*.astro)
- **Layout HTML** (layouts/DashboardLayout.astro)
- **API Routes** (pages/api/*) — server-side only
- **SSR** con Node adapter standalone
- **Hydration** de componentes React

### 2.2 React es la Interactividad

React controla:
- **Componentes interactivos** (client:load en Astro)
- **Estado** (Context API, hooks)
- **Feature pages** renderizadas como islas React
- **Lazy loading** de pages via React.lazy + Suspense

### 2.3 Patron: Astro Page → React Island

```astro
---
// pages/search.astro
import DashboardLayout from "../layouts/DashboardLayout.astro";
import { DashboardShell } from "../components/layout/DashboardShell";
---

<DashboardLayout title="Search">
  <DashboardShell client:load activePage="search" />
</DashboardLayout>
```

**Regla**: Cada page Astro es minimal — solo importa el Layout y monta el DashboardShell con `client:load`. Toda la logica interactiva vive en React.

---

## 3. Dual Runtime: Server vs Browser Mode

### 3.1 Concepto

klay+ soporta dos modos de ejecucion:
- **Server mode**: React llama a API routes Astro (/api/pipeline/*), que ejecutan @klay/core en el server
- **Browser mode**: React importa @klay/core directamente y ejecuta en el browser (IndexedDB)

### 3.2 RuntimeModeContext

```typescript
// El contexto provee: mode, setMode, service, isInitializing
// El service se carga dinamicamente segun el modo

useEffect(() => {
  if (mode === "server") {
    const { ServerPipelineService } = await import("../services/server-pipeline-service");
    setService(new ServerPipelineService());
  } else {
    const { BrowserPipelineService } = await import("../services/browser-pipeline-service");
    setService(new BrowserPipelineService());
  }
}, [mode]);
```

### 3.3 PipelineService Interface

La interface `PipelineService` abstrae ambos modos. Los componentes no saben si estan en server o browser mode.

```typescript
export interface PipelineService {
  execute(input: ExecutePipelineInput): Promise<ServiceResult<ExecutePipelineSuccess>>;
  ingestDocument(input: IngestDocumentInput): Promise<ServiceResult<IngestDocumentSuccess>>;
  searchKnowledge(input: SearchKnowledgeInput): Promise<ServiceResult<SearchKnowledgeSuccess>>;
  // ...
}
```

### 3.4 Reglas del Dual Runtime

```
✅ CORRECTO                              ❌ INCORRECTO
───────────────────────────────────────────────────────────────
Componente usa service via hook           Componente importa @klay/core directamente
Service se carga con dynamic import       Service hardcodeado al startup
Mode persiste en localStorage             Mode se pierde al recargar
RuntimeModeProvider wrappea todo          Componentes crean su propio service
```

---

## 4. Service Layer Pattern

### 4.1 ServiceResult

```typescript
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string; step?: string; completedSteps?: string[] } };
```

### 4.2 ServerPipelineService

Delega a las API routes de Astro via fetch:

```typescript
export class ServerPipelineService implements PipelineService {
  async searchKnowledge(input: SearchKnowledgeInput): Promise<ServiceResult<SearchKnowledgeSuccess>> {
    return this._post("/api/pipeline/search", input);
  }

  private async _post<T>(path: string, body: unknown): Promise<ServiceResult<T>> {
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: { message: "Network error", code: "NETWORK_ERROR" } };
    }
  }
}
```

### 4.3 BrowserPipelineService

Importa y ejecuta @klay/core directamente en el browser.

### 4.4 Agregar nueva operacion al service

1. Agregar metodo a `PipelineService` interface
2. Implementar en `ServerPipelineService` (fetch a API route)
3. Implementar en `BrowserPipelineService` (llamada directa a @klay/core)
4. Crear API route en `pages/api/pipeline/`
5. Agregar types en @klay/core si no existen

---

## 5. Hook Pattern: usePipelineAction

### 5.1 Uso

```tsx
const service = usePipelineService();
const searchAction = useCallback(
  (input: SearchKnowledgeInput) => service.searchKnowledge(input),
  [service],
);
const { data, error, isLoading, execute } = usePipelineAction(searchAction);
```

### 5.2 Lo que maneja automaticamente

- Estado de loading
- Estado de error (con code, message, step, completedSteps)
- Estado de data (resultado exitoso)
- Reset de error al re-ejecutar

### 5.3 Agregar nuevo hook custom

Cuando una feature necesita logica de estado compleja mas alla de `usePipelineAction`, crear un hook custom en `hooks/`:

```typescript
// hooks/useDocumentUpload.ts
export function useDocumentUpload() {
  const service = usePipelineService();
  const [uploadProgress, setUploadProgress] = useState(0);

  const upload = usePipelineAction(
    useCallback((input: IngestDocumentInput) => service.ingestDocument(input), [service]),
  );

  // Logica adicional...
  return { ...upload, uploadProgress };
}
```

---

## 6. Component Organization

### 6.1 Shared Components (Primitivos UI)

Ubicacion: `components/shared/`

Reglas:
- **Sin logica de negocio** — solo presentacion
- **Props tipadas** — extends de HTML natives cuando aplique
- **Variantes via props** — variant, size, etc.
- **className pass-through** — siempre aceptar className extra
- **Usan Tailwind component classes** definidas en global.css

```typescript
// Patron: componente shared
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) {
  return (
    <button className={`${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
```

### 6.2 Feature Components (Domain-specific)

Ubicacion: `components/features/{feature-name}/`

Cada feature tiene:
- **{Feature}Page.tsx** — componente principal de la pagina
- **Sub-componentes** — piezas especificas de la feature
- **Usa shared components** para primitivos UI
- **Usa hooks** para estado y service calls

```
features/search/
├── SearchPage.tsx          # Pagina principal
├── SearchBar.tsx           # Input de busqueda
├── SearchResults.tsx       # Lista de resultados
└── SearchResultCard.tsx    # Card individual
```

### 6.3 Layout Components

Ubicacion: `components/layout/`

- **DashboardShell.tsx** — Shell principal: Sidebar + Header + lazy page routing
- **Header.tsx** — Barra superior con titulo y runtime mode toggle
- **Sidebar.tsx** — Navegacion lateral

**DashboardShell maneja el routing de paginas React** via lookup table + React.lazy:

```typescript
const PAGE_COMPONENTS: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  documents: DocumentsPage,
  // ...
};
```

---

## 7. API Routes (Astro Server-Side)

### 7.1 Ubicacion y Patron

```
pages/api/pipeline/
├── execute.ts
├── ingest.ts
├── process.ts
├── catalog.ts
├── search.ts
├── profiles.ts
└── manifest.ts
```

### 7.2 Patron de API Route

```typescript
// pages/api/pipeline/search.ts
import type { APIRoute } from "astro";
import { getPipeline } from "../../../server/pipeline-singleton";

export const POST: APIRoute = async ({ request }) => {
  try {
    const input = await request.json();
    const pipeline = await getPipeline();
    const result = await pipeline.searchKnowledge(input);

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

### 7.3 Pipeline Singleton

El server mantiene una unica instancia del pipeline de @klay/core:

```typescript
// server/pipeline-singleton.ts
let instance: Pipeline | null = null;

export async function getPipeline(): Promise<Pipeline> {
  if (!instance) {
    instance = await createPipeline({ type: "server" });
  }
  return instance;
}
```

---

## 8. Reglas y Convenciones

### 8.1 Nombrado

| Tipo | Patron | Ejemplo |
|------|--------|---------|
| Feature page component | `{Feature}Page.tsx` | `SearchPage.tsx` |
| Feature sub-component | `{Descriptor}.tsx` | `SearchBar.tsx`, `SearchResultCard.tsx` |
| Shared component | `{Name}.tsx` | `Button.tsx`, `Card.tsx` |
| Layout component | `{Name}.tsx` | `DashboardShell.tsx`, `Header.tsx` |
| Hook | `use{Name}.ts` | `usePipelineAction.ts` |
| Context | `{Name}Context.tsx` | `RuntimeModeContext.tsx` |
| Service | `{name}-service.ts` | `server-pipeline-service.ts` |
| Astro page | `{name}.astro` | `search.astro` |
| API route | `{name}.ts` | `search.ts` |

### 8.2 Imports

```typescript
// 1. React
import { useState, useCallback } from "react";
// 2. Contexts/hooks
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext.js";
import { usePipelineAction } from "../../../hooks/usePipelineAction.js";
// 3. Shared components
import { Card, CardHeader, CardBody } from "../../shared/Card.js";
// 4. Feature components
import { SearchBar } from "./SearchBar.js";
// 5. Types (from @klay/core)
import type { SearchKnowledgeInput } from "@klay/core";
```

**Regla**: Siempre usar extension `.js` en imports (TypeScript con moduleResolution bundler/node16).

### 8.3 Checklist: Nueva Feature Page

- [ ] Crear directorio en `components/features/{feature}/`
- [ ] Crear `{Feature}Page.tsx` como componente principal
- [ ] Crear sub-componentes especificos de la feature
- [ ] Agregar lazy import en `DashboardShell.tsx`
- [ ] Agregar entrada en `PAGE_TITLES` y `PAGE_COMPONENTS`
- [ ] Crear pagina Astro en `pages/{feature}.astro`
- [ ] Agregar link en `Sidebar.tsx`
- [ ] Si necesita API: crear route en `pages/api/pipeline/`
- [ ] Si necesita API: agregar metodo a `PipelineService` interface
- [ ] Si necesita API: implementar en ambos services (server + browser)

---

*Skill de patrones Astro+React para klay+ web*
