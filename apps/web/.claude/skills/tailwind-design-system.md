# Tailwind Design System — klay+ Web

## Descripcion

Sistema de diseno de klay+ web basado en Tailwind CSS. Define tokens, component classes, patrones de estilo y convenciones para mantener consistencia visual.

---

## 0. Arquitectura de Estilos

```
Tailwind Config (tokens)
    │
    ▼
global.css (@layer components)
    │
    ▼
Shared Components (Button, Card, Input, etc.)
    │
    ▼
Feature Components (usan shared + utility classes)
```

**Principio**: Los tokens se definen en `tailwind.config.ts`. Las component classes se definen en `global.css` via `@layer components`. Los componentes React consumen las classes.

---

## 1. Design Tokens

### 1.1 Colores

```typescript
// tailwind.config.ts
colors: {
  primary: {
    50: "#eff6ff",   // Backgrounds suaves
    100: "#dbeafe",  // Hover backgrounds
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",  // Default
    600: "#2563eb",  // Primary actions (botones)
    700: "#1d4ed8",  // Hover primary
    800: "#1e40af",
    900: "#1e3a8a",  // Text en fondos claros
  },
  success: {
    50: "#f0fdf4",  100: "#dcfce7",
    500: "#22c55e", 600: "#16a34a", 700: "#15803d",
  },
  danger: {
    50: "#fef2f2",  100: "#fee2e2",
    500: "#ef4444", 600: "#dc2626", 700: "#b91c1c",
  },
  warning: {
    50: "#fffbeb",  100: "#fef3c7",
    500: "#f59e0b", 600: "#d97706",
  },
}
```

### 1.2 Tipografia

```typescript
fontFamily: {
  sans: ["Inter", "system-ui", "sans-serif"],     // UI text
  mono: ["JetBrains Mono", "Menlo", "monospace"],  // Code, IDs, technical
},
```

### 1.3 Spacing Custom

```typescript
spacing: {
  sidebar: "240px",   // Ancho del sidebar
  header: "64px",     // Alto del header
},
```

### 1.4 Border Radius

```typescript
borderRadius: {
  card: "8px",   // Cards y contenedores
},
```

---

## 2. Component Classes (global.css)

### 2.1 Cards

```css
.card        { @apply bg-white rounded-card border border-gray-200 shadow-sm; }
.card-header { @apply px-6 py-4 border-b border-gray-200; }
.card-body   { @apply px-6 py-4; }
.card-footer { @apply px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-card; }
```

### 2.2 Buttons

```css
.btn          { @apply inline-flex items-center justify-center font-medium rounded-lg
                transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed; }
.btn-primary  { @apply btn bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500; }
.btn-secondary { @apply btn bg-white text-gray-700 border border-gray-300
                hover:bg-gray-50 focus:ring-primary-500; }
.btn-danger   { @apply btn bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500; }
.btn-sm       { @apply px-3 py-1.5 text-sm; }
.btn-md       { @apply px-4 py-2 text-sm; }
.btn-lg       { @apply px-6 py-3 text-base; }
```

### 2.3 Inputs

```css
.input       { @apply block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
               placeholder:text-gray-400 focus:border-primary-500 focus:ring-1
               focus:ring-primary-500 focus:outline-none; }
.input-error { @apply border-danger-500 focus:border-danger-500 focus:ring-danger-500; }
.label       { @apply block text-sm font-medium text-gray-700 mb-1; }
```

### 2.4 Data Tables

```css
.data-table          { @apply w-full text-sm text-left; }
.data-table thead    { @apply bg-gray-50 border-b border-gray-200; }
.data-table th       { @apply px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs; }
.data-table td       { @apply px-4 py-3 border-b border-gray-100; }
.data-table tbody tr:hover { @apply bg-gray-50; }
```

### 2.5 Navigation

```css
.sidebar-item        { @apply flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                       text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors; }
.sidebar-item-active { @apply bg-primary-50 text-primary-700 hover:bg-primary-100; }
```

### 2.6 Badges (Status)

```css
.badge            { @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium; }
.badge-complete   { @apply badge bg-success-100 text-success-700; }
.badge-failed     { @apply badge bg-danger-100 text-danger-700; }
.badge-pending    { @apply badge bg-warning-100 text-warning-600; }
.badge-processing { @apply badge bg-primary-100 text-primary-700; }
```

### 2.7 Metric Cards

```css
.metric-card { @apply card p-6; }
```

---

## 3. Patrones de Uso en Componentes

### 3.1 Shared Components usan las CSS classes

```tsx
// Button.tsx — usa .btn-primary, .btn-sm, etc.
export function Button({ variant = "primary", size = "md", className = "", ...props }) {
  return (
    <button className={`${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// Card.tsx — usa .card, .card-header, etc.
export function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}
```

### 3.2 Feature Components combinan shared + utility classes

```tsx
// SearchPage.tsx
<div className="space-y-6">
  <Card>
    <CardHeader>
      <h2 className="text-base font-semibold text-gray-900">Semantic Search</h2>
    </CardHeader>
    <CardBody>
      <SearchBar onSearch={handleSearch} isLoading={isLoading} />
    </CardBody>
  </Card>
</div>
```

### 3.3 Layout usa spacing tokens

```tsx
// DashboardShell.tsx
<main className="ml-sidebar mt-header p-6">
  {/* ml-sidebar = margin-left: 240px */}
  {/* mt-header = margin-top: 64px */}
</main>
```

---

## 4. Reglas de Estilo

### 4.1 Donde definir estilos

| Tipo de estilo | Donde definir | Ejemplo |
|----------------|---------------|---------|
| Token (color, font, spacing) | `tailwind.config.ts` | `primary-600`, `sidebar` |
| Component class reutilizable | `global.css @layer components` | `.btn-primary`, `.card` |
| Estilo unico de un componente | Utility classes inline | `className="space-y-6"` |
| Estado dinamico | Utility classes condicionales | `isActive ? "sidebar-item-active" : ""` |

### 4.2 Orden de clases Tailwind (convencion)

```
Layout → Spacing → Sizing → Typography → Colors → Effects → States
flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors
```

### 4.3 Errores a evitar

```
✅ CORRECTO                              ❌ INCORRECTO
───────────────────────────────────────────────────────────────
Usar primary-600 del config              Hardcodear #2563eb inline
Definir component class en global.css    Repetir la misma cadena de utilities
className pass-through en shared         Shared component sin className prop
Usar spacing tokens (sidebar, header)    Hardcodear 240px en utility
Combinar .card class + utility           Redefinir .card en cada componente
Usar @layer components                   Usar @layer base para componentes
```

---

## 5. Agregar Nuevo Componente Shared

### 5.1 Checklist

1. Definir component class en `global.css` si es reutilizable
2. Crear componente en `components/shared/{Name}.tsx`
3. Tipar props (extends de HTML native si aplica)
4. Aceptar `className` prop para pass-through
5. Usar las CSS classes del global.css
6. Defaults sensatos para variant/size

### 5.2 Template

```tsx
import type { HTMLAttributes } from "react";

interface {Name}Props extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "accent";
}

export function {Name}({ variant = "default", className = "", children, ...props }: {Name}Props) {
  return (
    <div className={`{name} {name}-${variant} ${className}`} {...props}>
      {children}
    </div>
  );
}
```

---

## 6. Agregar Nuevo Token

### 6.1 Color

```typescript
// tailwind.config.ts → theme.extend.colors
info: {
  50: "#f0f9ff",
  100: "#e0f2fe",
  500: "#0ea5e9",
  600: "#0284c7",
  700: "#0369a1",
},
```

### 6.2 Spacing

```typescript
// tailwind.config.ts → theme.extend.spacing
"content-max": "1200px",
```

### 6.3 Component Class

```css
/* global.css → @layer components */
.badge-info {
  @apply badge bg-info-100 text-info-700;
}
```

---

*Skill del design system Tailwind para klay+ web*
