# Design: Design System Cleanup

**Date**: 2026-03-05
**Status**: Approved
**Scope**: `apps/web` — styling system consolidation

## Problem

The web app has a well-defined design system (CSS variables + Tailwind tokens + component classes in global.css) that is largely unused. Instead, ~186 inline styles across 34 files reference CSS vars directly via `style={{}}`, and JS-driven hover states replace what Tailwind `hover:` classes should do. Key components (`Card`, `MetricCard`, `DashboardLayout`) use hardcoded Tailwind colors instead of the token system.

## Approach: Design System with Tailwind Tokens

Single source of truth: CSS variables in `global.css` → mapped in `tailwind.config.ts` → consumed as Tailwind utility classes. Zero inline styles.

## Changes

### 1. Token Gaps in `tailwind.config.ts`

Add missing mappings so all inline styles can become Tailwind classes:

```ts
// boxShadow — map to CSS vars
boxShadow: {
  xs: "var(--shadow-xs)",
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
  glow: "var(--shadow-glow)",
  "glow-accent": "var(--glow-accent)",
  "glow-focus": "var(--glow-focus)",
}

// letterSpacing
letterSpacing: {
  tighter: "-0.02em",  // used on headings throughout
}
```

### 2. Card Component → `.card` Class

Replace `Card` React component's hardcoded Tailwind with CSS component classes:

```tsx
// Before
<div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/10 backdrop-blur-sm shadow-xl">

// After
<div className={`card ${className}`}>
```

Same for `CardHeader` → `.card-header`, `CardBody` → `.card-body`, `CardFooter` → `.card-footer`.

### 3. MetricCard → Semantic Tokens

Replace hardcoded gradient chains with design system colors:

| Variant | Before | After |
|---------|--------|-------|
| default | `from-blue-300 via-blue-400...` | `bg-accent-muted border-accent` |
| success | `from-green-300 via-green-400...` | `bg-success-muted border-success` |
| danger | `from-red-300 via-red-400...` | `bg-danger-muted border-danger` |

### 4. DashboardLayout → Surface Tokens

```diff
- <body class="bg-slate-50 dark:bg-slate-950">
+ <body class="bg-surface-0">
```

Orbs stay as decorative elements (not semantic).

### 5. Inline Style Elimination (~186 instances, 34 files)

Systematic replacement:

| Pattern | Replacement |
|---------|-------------|
| `style={{ color: "var(--text-primary)" }}` | `text-primary` |
| `style={{ color: "var(--text-secondary)" }}` | `text-secondary` |
| `style={{ color: "var(--text-tertiary)" }}` | `text-tertiary` |
| `style={{ color: "var(--text-ghost)" }}` | `text-ghost` |
| `style={{ letterSpacing: "-0.02em" }}` | `tracking-tighter` |
| `style={{ backgroundColor: "var(--surface-N)" }}` | `bg-surface-N` |
| `style={{ borderColor: "var(--border-*)" }}` | `border-*` |
| `style={{ transition: "all 150ms ..." }}` | `transition-all duration-fast ease-out-expo` |
| `style={{ boxShadow: "var(--shadow-*)" }}` | `shadow-*` |
| `onMouseEnter/Leave` JS hover | `hover:` Tailwind variants |
| `style={{ backgroundColor: "var(--surface-secondary)" }}` | `bg-surface-1` (bug fix) |

### 6. Unchanged

- `global.css` CSS variables and component classes
- Animations in tailwind.config.ts
- Grid overlay and orb decorations in DashboardLayout
