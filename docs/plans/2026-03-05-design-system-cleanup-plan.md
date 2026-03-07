# Design System Cleanup — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate all inline styles (~186 across 31 files) and hardcoded Tailwind colors, replacing them with design system tokens defined in `tailwind.config.ts`.

**Architecture:** CSS variables (global.css `:root`) → Tailwind tokens (tailwind.config.ts `extend`) → utility classes in JSX. Component classes in `@layer components` for reusable patterns. Zero `style={{}}` except for truly dynamic runtime values (e.g., computed zIndex).

**Tech Stack:** TailwindCSS 3.x, Astro, React, TypeScript

---

## Conventions

### Token mapping cheatsheet

| Inline style pattern | Tailwind class |
|---|---|
| `style={{ color: "var(--text-primary)" }}` | `text-primary` |
| `style={{ color: "var(--text-secondary)" }}` | `text-secondary` |
| `style={{ color: "var(--text-tertiary)" }}` | `text-tertiary` |
| `style={{ color: "var(--text-ghost)" }}` | `text-ghost` |
| `style={{ color: "var(--accent-primary)" }}` | `text-accent` |
| `style={{ color: "var(--semantic-success)" }}` | `text-success` |
| `style={{ color: "var(--semantic-danger)" }}` | `text-danger` |
| `style={{ color: "var(--semantic-warning)" }}` | `text-warning` |
| `style={{ backgroundColor: "var(--surface-N)" }}` | `bg-surface-N` |
| `style={{ backgroundColor: "var(--accent-primary-muted)" }}` | `bg-accent-muted` |
| `style={{ backgroundColor: "var(--semantic-*-muted)" }}` | `bg-success-muted` / `bg-danger-muted` / `bg-warning-muted` |
| `style={{ backgroundColor: "var(--code-bg)" }}` | `bg-code` |
| `style={{ borderColor: "var(--border-subtle)" }}` | `border-subtle` |
| `style={{ borderColor: "var(--border-default)" }}` | `border-default` |
| `style={{ borderColor: "var(--border-strong)" }}` | `border-strong` |
| `style={{ borderColor: "var(--accent-primary)" }}` | `border-accent` |
| `style={{ letterSpacing: "-0.02em" }}` | `tracking-heading` |
| `style={{ letterSpacing: "-0.01em" }}` | (drop — imperceptible) |
| `style={{ letterSpacing: "0.06em" }}` | `tracking-caps` |
| `style={{ transition: "all 150ms cubic-bezier(...)" }}` | `transition-all duration-fast ease-out-expo` |
| `style={{ transition: "all 200ms cubic-bezier(...)" }}` | `transition-all duration-normal ease-out-expo` |
| `style={{ transition: "color 150ms" }}` | `transition-colors duration-fast` |
| `style={{ boxShadow: "var(--shadow-sm)" }}` | `shadow-sm` |
| `style={{ boxShadow: "var(--shadow-glow)" }}` | `shadow-glow` |
| `onMouseEnter/Leave → color change` | `hover:text-primary hover:bg-surface-3 transition-colors duration-fast` |
| `onMouseEnter/Leave → opacity change` | `hover:opacity-80 transition-opacity duration-fast` |
| `border: "1px solid var(--border-*)"` | `border border-*` |
| `borderTop: "1px solid var(--border-subtle)"` | `border-t border-subtle` |
| `text-slate-800 dark:text-slate-200` | `text-primary` |
| `bg-slate-200/60 dark:bg-slate-800/60` | `bg-surface-1` |
| `bg-slate-200/40 dark:bg-slate-800/40` | `bg-surface-1` |
| `border-slate-200 dark:border-slate-800` | `border-default` |
| `bg-slate-100 dark:bg-slate-800/60` | `bg-surface-3` |

### Conditional style pattern

```tsx
// BEFORE
style={{
  backgroundColor: isActive ? "var(--accent-primary-muted)" : "var(--surface-2)",
  color: isActive ? "var(--accent-primary)" : "var(--text-tertiary)",
}}

// AFTER
className={`... ${isActive ? "bg-accent-muted text-accent" : "bg-surface-2 text-tertiary"}`}
```

### Legitimate inline styles (keep)

Only these patterns may remain as `style={{}}`:
- **Computed zIndex** (Overlay.tsx — runtime-calculated stack)
- **Dynamic width** (`width: ${percent}%` — runtime-calculated percentage)
- **Conditional backgroundColor with rgba** (Overlay backdrop — animated between transparent and rgba)

---

## Task 1: Extend `tailwind.config.ts` with missing tokens

**Files:**
- Modify: `apps/web/tailwind.config.ts`

**Step 1: Add boxShadow, letterSpacing, and code color tokens**

```ts
// Inside theme.extend, add:
boxShadow: {
  xs: "var(--shadow-xs)",
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
  glow: "var(--shadow-glow)",
  "glow-accent": "var(--glow-accent)",
  "glow-focus": "var(--glow-focus)",
},
letterSpacing: {
  heading: "-0.02em",
  caps: "0.06em",
},
```

Add `code` to the colors object:
```ts
colors: {
  // ...existing surface, accent, success, danger, warning, info...
  code: "var(--code-bg)",
},
```

**Step 2: Verify tokens resolve**

Run: `pnpm --filter @klay/web dev`
Add a temporary `<div className="shadow-sm tracking-heading bg-code">test</div>` to confirm classes work. Remove after verification.

**Step 3: Commit**

```
feat(web): extend tailwind config with shadow, tracking, and code tokens
```

---

## Task 2: Fix shared primitive components

**Files:**
- Modify: `apps/web/src/components/shared/Card.tsx`
- Modify: `apps/web/src/components/shared/MetricCard.tsx`
- Modify: `apps/web/src/components/shared/Input.tsx`
- Modify: `apps/web/src/components/shared/Select.tsx`
- Modify: `apps/web/src/components/shared/Spinner.tsx`
- Modify: `apps/web/src/components/shared/EmptyState.tsx`
- Modify: `apps/web/src/components/shared/ErrorDisplay.tsx`
- Modify: `apps/web/src/components/shared/Toast.tsx`
- Modify: `apps/web/src/components/shared/Tooltip.tsx`

### Card.tsx — Use `.card` CSS class

```tsx
// BEFORE
export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`p-6 rounded-3xl border border-slate-200 dark:border-slate-800
      bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm
      shadow-xl shadow-slate-200/20 dark:shadow-blue-800/20 ${className}`}>
      {children}
    </div>
  );
}
export function CardHeader({ children, className = "" }: CardProps) {
  return <div className={`p-4 text-4xl font-semibold ${className}`}>{children}</div>;
}
export function CardBody({ children, className = "" }: CardProps) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
export function CardFooter({ children, className = "" }: CardProps) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

// AFTER
export function Card({ children, className = "" }: CardProps) {
  return <div className={`card ${className}`}>{children}</div>;
}
export function CardHeader({ children, className = "" }: CardProps) {
  return <div className={`card-header ${className}`}>{children}</div>;
}
export function CardBody({ children, className = "" }: CardProps) {
  return <div className={`card-body ${className}`}>{children}</div>;
}
export function CardFooter({ children, className = "" }: CardProps) {
  return <div className={`card-footer ${className}`}>{children}</div>;
}
```

### MetricCard.tsx — Use semantic color tokens

```tsx
// BEFORE
const VARIANT_ACCENT = {
  default: "from-blue-300 via-blue-400 to-blue-300 dark:from-blue-500 ...",
  success: "from-green-300 via-green-400 ...",
  danger: "from-red-300 via-red-400 ...",
};

// AFTER — flat semantic colors, no gradients
const VARIANT_STYLES = {
  default: "bg-accent-muted border border-accent text-accent",
  success: "bg-success-muted border border-success text-success",
  danger: "bg-danger-muted border border-danger text-danger",
};

// In the render:
<div className={`rounded-lg p-4 ${VARIANT_STYLES[variant]}`}>
```

### Input.tsx — Replace error text inline style

Replace `style={{ color: "var(--semantic-danger)" }}` with `className="text-danger"` on error message element.

### Select.tsx — Same as Input.tsx

Replace error text inline style with `className="text-danger"`.

### Spinner.tsx — Replace accent color inline style

Replace `style={{ color: "var(--accent-primary)" }}` with `className="text-accent"`.

### EmptyState.tsx — Replace all 4 inline styles

- Icon container: `bg-surface-3` instead of inline backgroundColor
- Icon: `text-tertiary` instead of inline color
- Title: `text-primary` instead of inline color
- Description: `text-tertiary` instead of inline color

### ErrorDisplay.tsx — Replace ~7 inline styles

- Container: `bg-danger-muted border border-danger rounded-lg p-4` instead of inline bg/border
- Icon: `text-danger mt-0.5 flex-shrink-0` instead of inline styles
- Message text: `text-danger`
- Code/step text: `text-tertiary` / `text-secondary`

### Toast.tsx — Replace inline styles + remove onMouseEnter/Leave

Replace close button:
```tsx
// BEFORE
style={{ color: "var(--text-ghost)", transition: "color 150ms" }}
onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-ghost)"; }}

// AFTER
className="... text-ghost hover:text-primary transition-colors duration-fast"
// Remove onMouseEnter/onMouseLeave entirely
```

### Tooltip.tsx — Replace inline styles

Replace tooltip container:
```tsx
// BEFORE
style={{
  backgroundColor: "var(--surface-4)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-default)",
  boxShadow: "var(--shadow-lg)",
}}

// AFTER
className="... bg-surface-4 text-primary border border-default shadow-lg"
```

**Verification:** Run dev server, inspect Card/MetricCard/Toast/Tooltip visually.

**Commit:**
```
refactor(web): migrate shared components from inline styles to tailwind tokens
```

---

## Task 3: Fix layout components

**Files:**
- Modify: `apps/web/src/layouts/DashboardLayout.astro`
- Modify: `apps/web/src/components/layout/Sidebar.tsx`
- Modify: `apps/web/src/components/layout/UnitSidebar.tsx`
- Modify: `apps/web/src/components/layout/Header.tsx`
- Modify: `apps/web/src/components/layout/DashboardShell.tsx`
- Modify: `apps/web/src/components/layout/UnitShell.tsx`

### DashboardLayout.astro

```diff
- <body class="bg-slate-50 dark:bg-slate-950">
+ <body class="bg-surface-0">
```

(Orbs and grid overlay stay as-is — they're decorative with specific opacity values.)

### Sidebar.tsx

Full replacement — use design tokens instead of hardcoded slate:

```tsx
// Container: replace hardcoded slate with tokens
- className="... bg-slate-200/40 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800"
+ className="... bg-surface-1 border-r border-default"

// Logo border:
- className="... border-b border-slate-200 dark:border-slate-800"
+ className="... border-b border-default"

// Logo icon bg:
- className="... bg-slate-200/60 dark:bg-slate-800/60 ..."
+ className="... bg-surface-3 ..."

// Logo text: remove style, add classes
- style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
+ className="text-xl font-bold text-primary tracking-heading"

// Nav items: replace hardcoded slate + use sidebar-item pattern
- className={`px-6 py-3 font-thin text-lg bg-slate-300/60 dark:bg-slate-800/60 hover:bg-slate-200/60
-   dark:hover:bg-slate-700/60 rounded-lg ... text-slate-800 dark:text-slate-200
-   ${isActive && "bg-slate-200/60 dark:bg-slate-600/60"} ...`}
+ className={`sidebar-item text-lg ${isActive ? "sidebar-item-active" : ""}`}

// Footer: remove inline border + text styles
- style={{ borderTop: "1px solid var(--border-subtle)" }}
+ className="px-4 py-3 flex items-center justify-between border-t border-subtle"
// Version text:
- style={{ color: "var(--text-tertiary)" }}
+ className="text-xs text-tertiary"

// Theme toggle: remove inline styles + onMouseEnter/Leave
- style={{ color: "var(--text-tertiary)", transition: "all 150ms ..." }}
- onMouseEnter={(e) => { ... }}
- onMouseLeave={(e) => { ... }}
+ className="p-1.5 rounded-lg text-tertiary hover:text-primary hover:bg-surface-3 transition-all duration-fast ease-out-expo"
```

### UnitSidebar.tsx — Same pattern as Sidebar

Apply the same token replacements. Key changes:
- Unit ID text: `text-secondary` class
- Footer border: `border-t border-subtle` class
- Theme toggle: hover classes, remove JS handlers

### Header.tsx

```tsx
// Breadcrumb nav:
- style={{ letterSpacing: "-0.02em" }}
+ className="flex items-center gap-1 text-lg font-semibold tracking-heading"

// Chevron:
- style={{ color: "var(--text-tertiary)" }}
+ className="text-tertiary"

// Breadcrumb link:
- style={{ color: "var(--text-secondary)" }}
+ className="hover:underline text-secondary"

// Title:
- style={{ letterSpacing: "-0.02em" }}
+ className="text-lg font-semibold tracking-heading"

// Runtime mode toggle buttons — conditional className:
// Server button:
- style={{ backgroundColor: mode === "server" ? "var(--accent-primary)" : "transparent", ... }}
+ className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium
+   transition-all duration-fast ease-out-expo
+   ${mode === "server" ? "bg-accent text-white shadow-xs" : "bg-transparent text-primary"}`}

// Server dot indicator:
- style={{ backgroundColor: mode === "server" ? "#fff" : "currentColor", opacity: ..., boxShadow: ... }}
+ className={`w-1.5 h-1.5 rounded-full transition-all duration-fast ease-out-expo
+   ${mode === "server" ? "bg-white opacity-100 shadow-[0_0_4px_rgba(255,255,255,0.6)]" : "bg-current opacity-30"}`}

// Browser button — same pattern with success token:
+ className={`... ${mode === "browser" ? "bg-success text-white shadow-xs" : "bg-transparent text-primary"}`}

// Divider:
- style={{ backgroundColor: "var(--border-default)" }}
+ className="w-px h-5 mx-1 bg-[var(--border-default)]"
// Note: bg-border-default doesn't exist as a bg token, use arbitrary value or add to config

// Theme toggle: remove inline styles + onMouseEnter/Leave
+ className="p-2 rounded-lg text-tertiary hover:text-primary hover:bg-surface-3 transition-all duration-fast ease-out-expo"
```

### DashboardShell.tsx + UnitShell.tsx

Replace the single inline style each:
```tsx
- style={{ color: "var(--text-tertiary)" }}
+ className="text-tertiary"
```

**Verification:** Dev server — check sidebar, header, mode toggle, theme toggle all look correct in both light/dark modes.

**Commit:**
```
refactor(web): migrate layout components from inline styles to tailwind tokens
```

---

## Task 4: Fix Dashboard and Documents pages

**Files:**
- Modify: `apps/web/src/components/features/dashboard/DashboardPage.tsx`
- Modify: `apps/web/src/components/features/documents/DocumentsPage.tsx`
- Modify: `apps/web/src/components/features/documents/DocumentUploadForm.tsx`

### DashboardPage.tsx

```tsx
// Container:
- className="space-y-8 text-slate-800 dark:text-slate-200"
+ className="space-y-8 text-primary"

// Card header titles (2x):
- style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
+ className="text-lg font-semibold text-primary tracking-heading"

// "Ingest your first document" link: remove inline style + onMouseEnter/Leave
- style={{ color: "var(--accent-primary)", transition: "opacity 150ms" }}
- onMouseEnter/onMouseLeave (opacity manipulation)
+ className="text-xs mt-1 inline-block text-accent hover:opacity-80 transition-opacity duration-fast"

// Quick action cards (3x):
- className="action-card flex items-center p-4 bg-slate-200/60 dark:bg-slate-800/60 rounded-lg"
+ className="action-card"
// Note: .action-card already defines all needed styles in global.css
```

### DocumentsPage.tsx

Replace ~4 inline styles:
- Header titles: `text-primary tracking-heading`
- Border: `border-subtle` class
- Upload panel title: `text-primary tracking-heading`

### DocumentUploadForm.tsx — Most complex file

Key replacements:
- Text colors (~10x): replace `style={{ color: "var(--text-*)" }}` with `text-*` classes
- Background: replace `var(--surface-secondary)` (bug!) with `bg-surface-1`
- Accent colors: `text-accent` class
- Validation error box: `bg-danger-muted text-danger rounded-lg p-3`
- Drop zone box-shadow: This uses a dynamic ternary with `isDragOver` — use arbitrary Tailwind:
  ```tsx
  className={`... ${isDragOver ? "shadow-[0_0_0_4px_var(--accent-primary-glow),0_0_30px_var(--accent-primary-glow)]" : ""}`}
  ```
  Or add a custom shadow in tailwind config:
  ```ts
  "glow-drag": "0 0 0 4px var(--accent-primary-glow), 0 0 30px var(--accent-primary-glow)"
  ```

**Verification:** Upload a document, test drag-and-drop, verify success/error states look correct.

**Commit:**
```
refactor(web): migrate dashboard and document pages to tailwind tokens
```

---

## Task 5: Fix Search components

**Files:**
- Modify: `apps/web/src/components/features/search/SearchBar.tsx`
- Modify: `apps/web/src/components/features/search/SearchPage.tsx`
- Modify: `apps/web/src/components/features/search/SearchResultCard.tsx`

### SearchBar.tsx

- Icon: `text-ghost` class
- Labels (2x): `text-tertiary tracking-caps` class

### SearchPage.tsx

- Icons: `text-tertiary` class
- Header title: `text-primary tracking-heading`
- Result count text: `text-secondary` / `text-primary`

### SearchResultCard.tsx — Conditional colors + hover

```tsx
// Score color/bg — use class-based mapping:
const scoreClasses =
  scorePercent >= 80
    ? { text: "text-success", bg: "bg-success-muted" }
    : scorePercent >= 50
      ? { text: "text-accent", bg: "bg-accent-muted" }
      : { text: "text-warning", bg: "bg-warning-muted" };

// For the progress bar, score color is still needed as a CSS variable for bg:
const scoreBarColor =
  scorePercent >= 80 ? "bg-success" : scorePercent >= 50 ? "bg-accent" : "bg-warning";

// Card container — remove inline style + onMouseEnter/Leave:
- style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-subtle)", transition: "..." }}
- onMouseEnter/onMouseLeave
+ className="p-4 rounded-lg space-y-3 bg-surface-1 border border-subtle
+   hover:border-default hover:shadow-sm transition-all duration-fast ease-out-expo"

// Content text:
+ className="text-sm flex-1 line-clamp-3 text-secondary"

// Score badge:
+ className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono ${scoreClasses.bg} ${scoreClasses.text}`}

// Score bar background:
+ className="w-full h-1 rounded-full bg-surface-3"
// Score bar fill:
+ className={`h-1 rounded-full transition-[width] duration-slow ease-out-expo ${scoreBarColor}`}
+ style={{ width: `${scorePercent}%` }}  // ← legitimate inline style (dynamic value)

// Metadata:
+ className="flex items-center gap-4 text-xs text-tertiary"
```

**Verification:** Search for something, verify score badges color correctly by threshold.

**Commit:**
```
refactor(web): migrate search components to tailwind tokens
```

---

## Task 6: Fix Profiles pages

**Files:**
- Modify: `apps/web/src/components/features/profiles/ProfilesPage.tsx`
- Modify: `apps/web/src/components/features/profiles/ProfileList.tsx`
- Modify: `apps/web/src/components/features/profiles/ProfileEditForm.tsx`

### ProfilesPage.tsx (~8 inline styles)

All follow the standard pattern:
- Icons: `text-tertiary`
- Section titles: `text-primary tracking-heading`
- Body text: `text-secondary` / `text-tertiary`
- Info boxes: `bg-surface-1 border border-subtle rounded-lg p-4`
- Uppercase labels: `text-tertiary tracking-caps`

### ProfileList.tsx (~5 inline styles)

- Profile name: `text-primary`
- Metadata: `text-secondary`
- Deprecation dialog: `bg-surface-1 border border-default rounded-lg p-4`
- Dialog text: `text-primary` / `text-tertiary`

### ProfileEditForm.tsx (~3 inline styles)

- Form container: `bg-surface-1 border border-default rounded-lg p-4`
- Title: `text-primary`
- Metadata: `text-tertiary`

**Commit:**
```
refactor(web): migrate profile pages to tailwind tokens
```

---

## Task 7: Fix Units pages

**Files:**
- Modify: `apps/web/src/components/features/units/UnitsIndexPage.tsx`
- Modify: `apps/web/src/components/features/units/UnitCard.tsx`
- Modify: `apps/web/src/components/features/units/UnitDashboardPage.tsx`

### UnitsIndexPage.tsx

- Container: `text-primary` instead of `text-slate-800 dark:text-slate-200`
- Icons: `text-tertiary`
- Header title: `text-primary tracking-heading`
- Filter input: `bg-surface-3 border border-default text-primary` instead of hardcoded slate
- Links: `text-accent hover:opacity-80 transition-opacity duration-fast` (remove onMouseEnter/Leave)
- Metadata text: `text-secondary` / `text-tertiary`

### UnitCard.tsx

- Remove `textDecoration: "none"` (use `no-underline` class)
- Replace hardcoded blue hover: `group-hover:border-accent group-hover:shadow-md`
- Icons: `text-tertiary`
- Text: `text-primary` / `text-secondary`

### UnitDashboardPage.tsx — Large file with many inline styles

- Error display blocks (duplicate of ErrorDisplay pattern): `bg-danger-muted border border-danger` etc.
- Icons + headers (~8x): standard `text-tertiary` / `text-primary tracking-heading`
- Source containers: `bg-surface-0 border border-subtle`
- Accent links: `text-accent`
- Action cards (3x): just use `action-card` class (same as DashboardPage fix)

**Commit:**
```
refactor(web): migrate unit index, card, and dashboard pages to tailwind tokens
```

---

## Task 8: Fix remaining Unit sub-pages

**Files:**
- Modify: `apps/web/src/components/features/units/UnitSourcesPage.tsx`
- Modify: `apps/web/src/components/features/units/UnitVersionsPage.tsx`
- Modify: `apps/web/src/components/features/units/UnitProjectionsPage.tsx`
- Modify: `apps/web/src/components/features/units/UnitSearchPage.tsx`

### UnitSourcesPage.tsx

Standard pattern replacements:
- Error display: `bg-danger-muted border border-danger`
- Icons/headers: `text-tertiary` / `text-primary tracking-heading`
- Source IDs: `text-accent`
- Metadata: `text-secondary` / `text-tertiary` / `text-ghost`
- Border: `border-t border-subtle`

### UnitVersionsPage.tsx — Timeline has complex styles

Standard replacements plus:
- Timeline line: `bg-[var(--border-subtle)]` or `bg-surface-3`
- Timeline dot (conditional):
  ```tsx
  className={`w-3 h-3 rounded-full border-2 transition-all
    ${isCurrent
      ? "bg-accent border-accent shadow-[0_0_0_3px_var(--accent-primary-glow)]"
      : "bg-surface-2 border-[var(--border-subtle)]"
    }`}
  ```
- Version cards with blue border: `border-accent shadow-sm` instead of hardcoded `border-blue-400`
- Info boxes: `bg-surface-0 border border-subtle`
- Uppercase labels: `text-tertiary tracking-caps`

### UnitProjectionsPage.tsx

- Table cell text: `text-primary` / `text-secondary`
- Header: `text-tertiary` / `text-primary tracking-heading`
- Badges: `bg-surface-3 text-secondary`
- Summary metrics: `bg-surface-1` / `text-primary` / `text-tertiary tracking-caps`

### UnitSearchPage.tsx

- Icons: `text-tertiary`
- Header: `text-primary tracking-heading`
- Scoped badge: `bg-surface-1 text-tertiary`
- Description: `text-tertiary` / `text-secondary`

**Commit:**
```
refactor(web): migrate unit sub-pages to tailwind tokens
```

---

## Task 9: Fix Settings and remaining components

**Files:**
- Modify: `apps/web/src/components/features/settings/SettingsPage.tsx`
- Modify: `apps/web/src/components/features/knowledge/AddSourceForm.tsx`
- Modify: `apps/web/src/components/shared/Overlay.tsx` (partial — keep zIndex inline)

### SettingsPage.tsx — Theme/mode cards with conditional styles

Theme option buttons:
```tsx
// BEFORE (inline conditional styles)
style={{
  borderColor: isActive ? "var(--accent-primary)" : "var(--border-default)",
  backgroundColor: isActive ? "var(--accent-primary-muted)" : "var(--surface-2)",
  boxShadow: isActive ? "var(--shadow-glow)" : undefined,
  transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
}}

// AFTER (conditional className)
className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2
  transition-all duration-normal ease-out-expo
  ${isActive
    ? "border-accent bg-accent-muted shadow-glow"
    : "border-default bg-surface-2"
  }`}
```

Theme button icons/labels:
```tsx
className={`text-sm font-medium ${isActive ? "text-accent" : "text-secondary"}`}
```

Mode cards — already use `.mode-card` and `.mode-card-active-*` classes! Just fix the icon containers:
```tsx
// Server icon container:
className={`w-8 h-8 rounded-lg flex items-center justify-center
  ${mode === "server" ? "bg-accent-muted" : "bg-surface-3"}`}
// Server icon:
className={mode === "server" ? "text-accent" : "text-tertiary"}
```

Architecture code block:
```tsx
- style={{ backgroundColor: "var(--code-bg)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
+ className="font-mono text-xs rounded-lg p-5 overflow-x-auto leading-relaxed bg-code text-secondary border border-subtle"
```

Standard replacements for all other icons/headers/descriptions.

### AddSourceForm.tsx — Single inline style

Replace info text color with `text-tertiary`.

### Overlay.tsx — Partial cleanup

The Overlay has legitimate inline styles for `zIndex` (runtime computed) and backdrop `backgroundColor` (animated). Keep `zIndex` as inline. The backdrop color transitions with `visible` state — this is already handled via opacity classes, but `backgroundColor` also changes. Keep this as inline since it's animation-coupled.

**No changes needed for Overlay.tsx** — its inline styles are all legitimate runtime-dynamic values.

**Verification:** Check Settings page theme toggle, mode toggle, architecture diagram in both themes.

**Commit:**
```
refactor(web): migrate settings page and remaining components to tailwind tokens
```

---

## Task 10: Final cleanup and verification

**Files:**
- Verify: All modified files

**Step 1: Search for remaining inline styles**

Run: `grep -rn "style={{" apps/web/src/components/ --include="*.tsx"`

Expected: Only Overlay.tsx (zIndex + backdrop), and DocumentUploadForm.tsx (dynamic width `%`) should have any remaining `style={{}}`.

**Step 2: Search for remaining hardcoded slate/gray**

Run: `grep -rn "slate-\|gray-" apps/web/src/components/ --include="*.tsx"`

Expected: Zero matches (DashboardLayout.astro orbs are not in components/).

**Step 3: Search for remaining onMouseEnter/Leave style manipulation**

Run: `grep -rn "onMouseEnter\|onMouseLeave" apps/web/src/components/ --include="*.tsx"`

Expected: Zero matches (or only non-style-related handlers).

**Step 4: Full visual test**

Run dev server and check every page:
- [ ] Dashboard (metric cards, pipeline status, quick actions)
- [ ] Documents (upload form, drag zone, success/error states)
- [ ] Search (search bar, result cards with score badges)
- [ ] Profiles (list, edit form, deprecation dialog)
- [ ] Units index (unit cards, filter input)
- [ ] Unit dashboard (sources, actions)
- [ ] Unit sources, versions (timeline), projections, search
- [ ] Settings (theme toggle, mode toggle, architecture diagram)
- [ ] Light mode AND dark mode for all above
- [ ] Sidebar navigation, header breadcrumbs

**Step 5: Build**

Run: `pnpm --filter @klay/web build`
Expected: Clean build with no errors.

**Step 6: Final commit**

If any fixes were needed during verification, commit them:
```
fix(web): design system cleanup final fixes
```
