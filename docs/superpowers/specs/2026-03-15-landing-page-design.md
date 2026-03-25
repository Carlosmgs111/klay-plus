# klay+ Landing Page — Design Spec

**Date:** 2026-03-15
**Status:** Approved
**Stack:** Astro + Tailwind CSS
**Target directory:** `D:\Documentos\Desktop\klay+landing\`

---

## 1. Goal

Product-focused landing page that positions klay+ as a finished product. Communicates problem-solving capabilities and infrastructure composability. Captures leads via waitlist (evolving to demo + download later). Bilingual: English primary, Spanish toggle.

## 2. Visual Direction

**Dark & Bold** — deep navy/purple gradients, floating gradient orbs, glass-morphism cards, indigo/violet accent palette.

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0a0f` | Page background |
| `--bg-secondary` | `#1a1a2e` | Card backgrounds, sections |
| `--bg-tertiary` | `#16213e` | Elevated surfaces |
| `--accent-primary` | `#6366f1` | CTAs, highlights (indigo-500) |
| `--accent-secondary` | `#8b5cf6` | Gradient endpoints (violet-500) |
| `--accent-tertiary` | `#c084fc` | Hero headline gradient endpoint, eyebrow text, composable infra slot glow (violet-400) |
| `--text-primary` | `#f1f5f9` | Headings (slate-100) |
| `--text-secondary` | `#94a3b8` | Body copy (slate-400) |
| `--text-muted` | `#64748b` | Captions (slate-500) |
| `--glass-bg` | `rgba(255,255,255,0.05)` | Glass cards |
| `--glass-border` | `rgba(255,255,255,0.1)` | Glass borders |

**Typography:** Inter (headings 600-700, body 400). System font stack fallback.

**Effects:** Floating gradient orbs (CSS radial-gradient, positioned absolute), subtle grid/dot pattern overlay.

**Scroll animations:** All section headings and cards use a `fade-in-up` animation (opacity 0→1, translateY 20px→0, 0.5s ease-out). Triggered by Intersection Observer at 0.15 threshold, fires once per element. Implemented via a shared `data-reveal` attribute + a single observer script in Layout.astro.

## 3. Sections

### 3.1 Navigation

Fixed top, transparent → solid on scroll. Contains:
- Logo: "klay+" in text (font-weight 700, accent gradient)
- Links: Features, Use Cases, Pricing (scroll anchors)
- Language toggle: EN / ES pill switch (stores preference in `localStorage`, sets `data-lang` attribute on `<html>`, components read locale from this attribute)
- CTA button: "Get Early Access" (small, accent gradient)

**Mobile nav (<640px):** Hamburger icon replaces links. Opens a full-screen overlay with navigation links, language toggle, and CTA stacked vertically. Closes on link click or overlay tap.

### 3.2 Hero

Full viewport height. Centered content with floating orbs behind.

- **Eyebrow:** "Semantic Knowledge Platform" (uppercase, letter-spaced, accent color)
- **Headline EN:** "Your documents hold the answers. We help you find them."
- **Headline ES:** "Tus documentos tienen las respuestas. Te ayudamos a encontrarlas."
- **Subtitle EN:** "Stop searching by keywords. Start finding by meaning. klay+ transforms your files into a knowledge base you can actually talk to."
- **Subtitle ES:** "Deja de buscar por palabras clave. Empieza a encontrar por significado. klay+ transforma tus archivos en una base de conocimiento con la que puedes conversar."
- **CTA group:** "Get Early Access" (gradient button) + "See What It Can Do" (ghost button, scroll anchor)
- **Background:** Two gradient orbs (indigo + violet), dot grid overlay at 0.3 opacity

### 3.3 Problem → Solution

Three-column layout (stacks on mobile). Each column:

**Problem 1 — "Search fails you"**
- EN: "You know the answer is in your files. But keyword search returns nothing — because you're not using the exact words the document used."
- ES: "Sabes que la respuesta está en tus archivos. Pero la búsqueda por palabras no encuentra nada — porque no estás usando las palabras exactas del documento."
- Solution: "klay+ searches by meaning. Ask 'how does authentication work?' and find the answer even if the doc says 'login flow'."

**Problem 2 — "Knowledge is scattered"**
- EN: "Your information lives across PDFs, markdown notes, text files. Related ideas are invisible to each other."
- ES: "Tu información vive dispersa en PDFs, notas en markdown, archivos de texto. Las ideas relacionadas son invisibles entre sí."
- Solution: "klay+ connects everything into a unified knowledge base. One search across all your documents."

**Problem 3 — "Reconnecting takes hours"**
- EN: "Every time you need to find something, you re-read, re-scan, re-organize. Time you could spend on actual work."
- ES: "Cada vez que necesitas encontrar algo, relees, repasas, reorganizas. Tiempo que podrías usar en trabajo real."
- Solution: "klay+ gives you instant recall. Ask and get answers in seconds, ranked by relevance."

Visual treatment: Problem in muted text with a subtle red/amber tint. Solution in bright text with accent color. Arrow or transition between them.

### 3.4 Capabilities

Four glass cards in a 2x2 grid (stacks on mobile).

**Card 1 — "Find by meaning"**
- Icon: Magnifying glass with neural connections (SVG)
- EN: "Ask questions in natural language. klay+ understands what you mean, not just what you type. Get results ranked by semantic relevance."
- ES: "Haz preguntas en lenguaje natural. klay+ entiende lo que quieres decir, no solo lo que escribes. Obtén resultados ordenados por relevancia semántica."

**Card 2 — "Connect scattered knowledge"**
- Icon: Network/graph nodes (SVG)
- EN: "PDFs, Markdown, plain text — all unified into one searchable base. Find connections between documents you didn't know existed."
- ES: "PDFs, Markdown, texto plano — todo unificado en una base buscable. Encuentra conexiones entre documentos que no sabías que existían."

**Card 3 — "Your files, your rules"**
- Icon: Shield with lock (SVG)
- EN: "Everything runs on your machine. No data leaves your environment. No cloud dependency. No surprises."
- ES: "Todo corre en tu máquina. Tus datos no salen de tu entorno. Sin dependencia de la nube. Sin sorpresas."

**Card 4 — "Adapt to your workflow"**
- Icon: Puzzle pieces / building blocks (SVG)
- EN: "Choose your storage, your embedding model, your processing strategy. klay+ adapts to your infrastructure, not the other way around."
- ES: "Elige tu almacenamiento, tu modelo de embeddings, tu estrategia de procesamiento. klay+ se adapta a tu infraestructura, no al revés."

### 3.5 Composable Infrastructure

Key section — visual of interchangeable blocks, NOT a technical diagram. Communicate flexibility.

**Headline EN:** "Build the stack that works for you"
**Headline ES:** "Arma el stack que funcione para ti"

**Subtitle EN:** "klay+ doesn't lock you into one way of doing things. Mix and match components to fit your needs."
**Subtitle ES:** "klay+ no te encierra en una sola forma de hacer las cosas. Combina componentes según tus necesidades."

**Visual:** Three "slots" displayed horizontally, each showing swappable options:

| Slot | Label EN | Label ES | Options shown |
|------|----------|----------|---------------|
| Storage | "Where your data lives" | "Donde viven tus datos" | Local (NeDB), Browser (IndexedDB), In-Memory |
| Embedding | "How meaning is captured" | "Cómo se captura el significado" | OpenAI, Cohere, WebLLM (local), Hash (testing) |
| Processing | "How content is prepared" | "Cómo se prepara el contenido" | Recursive, Sentence-aware, Fixed-size (marketing names for chunking strategies) |

Each slot is a glass card with pill-shaped options that visually toggle (cosmetic, not functional). Gradient lines connect the slots to show they compose together.

**Bottom note EN:** "More providers and strategies coming soon. The architecture is designed to grow with you."
**Bottom note ES:** "Más proveedores y estrategias próximamente. La arquitectura está diseñada para crecer contigo."

### 3.6 Search Demo

Static mockup showing the "aha moment". Glass card with:

- Search input with placeholder: "How does authentication work in our API?"
- Three result cards showing:
  1. `api-auth-guide.md` — Section 3.2: "Authentication Flow" — **98% match**
  2. `security-overview.pdf` — Page 12: "Access Control" — **91% match**
  3. `dev-notes.md` — "Login Implementation Notes" — **84% match**
- Each result shows a content snippet preview (2-3 lines of text)
- Typing animation on the search input: types the placeholder character by character over 3s, holds for 2s, then resets. Loops indefinitely. Uses CSS `steps()` timing on `width` with `overflow: hidden` and a blinking cursor via `border-right`.

### 3.7 Use Cases

Three cards, each with a persona icon, pain point, and resolution:

**Knowledge Worker:**
- EN: "Maria manages 200+ reference documents. She used to spend 30 minutes finding the right paragraph. Now she asks klay+ and gets it in seconds."
- ES: "María maneja más de 200 documentos de referencia. Antes pasaba 30 minutos buscando el párrafo correcto. Ahora le pregunta a klay+ y lo obtiene en segundos."

**Researcher:**
- EN: "Carlos collects papers across 5 different topics. klay+ finds connections between papers he never would have linked manually."
- ES: "Carlos recopila papers de 5 temas distintos. klay+ encuentra conexiones entre papers que él nunca habría vinculado manualmente."

**Developer:**
- EN: "Ana needs semantic search in her app. Instead of building from scratch with raw embeddings, she uses klay+ as her knowledge layer."
- ES: "Ana necesita búsqueda semántica en su app. En lugar de construir desde cero con embeddings crudos, usa klay+ como su capa de conocimiento."

### 3.8 CTA Final

Dark section with prominent gradient border top.

- **Headline EN:** "Ready to unlock your knowledge?"
- **Headline ES:** "Desbloquea tu conocimiento"
- **Subtitle EN:** "Join the waitlist and be the first to try klay+ when it launches."
- **Subtitle ES:** "Únete a la lista de espera y prueba klay+ antes que nadie."
- **Form:** Email input + "Join the Waitlist" button
- **Note below form:** "No spam. We'll only email you when klay+ is ready." / "Sin spam. Solo te escribiremos cuando klay+ esté listo."

**Evolution plan:** When MVP is ready, this section adds two more CTAs: "Try the Demo" (hosted instance) and "Download & Self-host" (GitHub link). The waitlist form remains as tertiary option.

### 3.9 Footer

Minimal. Contains:
- Logo "klay+"
- Links: GitHub, Documentation (when available)
- Copyright: "© 2026 klay+"
- "Built with Astro" badge (optional)

## 4. Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Astro | Static output, zero JS default, perfect for landing |
| Styling | Tailwind CSS | Utility-first, fast iteration, dark theme support |
| i18n | JSON locale files + custom toggle | Simple, no heavy i18n library for 2 languages |
| Animations | CSS keyframes + Intersection Observer | No runtime JS library needed |
| Lead capture | Formspree (default) | Form action uses `FORM_ID` env var; fallback logs to console in dev. Swap to Netlify Forms or custom API by changing the action URL |
| Fonts | Inter via Google Fonts | Clean, widely available, great for product pages |
| Icons | Inline SVG | No icon library dependency |
| Deployment | Static HTML (Vercel, Netlify, GH Pages) | No server needed |

## 5. Project Structure

```
klay+landing/
├── src/
│   ├── components/       # Astro components per section
│   │   ├── Nav.astro
│   │   ├── Hero.astro
│   │   ├── ProblemSolution.astro
│   │   ├── Capabilities.astro
│   │   ├── ComposableInfra.astro
│   │   ├── SearchDemo.astro
│   │   ├── UseCases.astro
│   │   ├── CTAFinal.astro
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── Layout.astro   # Base HTML + head + scroll observer
│   ├── pages/
│   │   └── index.astro    # Assembles all sections
│   ├── i18n/
│   │   ├── en.json
│   │   └── es.json
│   └── styles/
│       └── global.css     # Tailwind directives + custom properties
├── public/
│   └── fonts/             # Inter if self-hosted
├── astro.config.mjs
├── tailwind.config.mjs
├── package.json
├── tsconfig.json
└── .claude/
    └── CLAUDE.md          # Project context for future sessions
```

## 6. Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Mobile (<640px) | Single column, stacked cards, hamburger nav |
| Tablet (640-1024px) | 2-column grids, compact spacing |
| Desktop (>1024px) | Full layout, 2x2 grids, side-by-side |

## 7. CTA Evolution Strategy

| Phase | Primary CTA | Secondary CTA | Tertiary |
|-------|------------|---------------|----------|
| **Now (pre-MVP)** | "Get Early Access" (waitlist email) | "See What It Can Do" (scroll) | — |
| **MVP ready** | "Try the Demo" (hosted) | "Download & Self-host" (GitHub) | "Join Waitlist" |
| **Post-launch** | "Get Started" (download/hosted) | "View Documentation" | "Star on GitHub" |
