# klay+ Landing Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a product-focused, bilingual (EN/ES) landing page for klay+ that communicates problem-solving capabilities and composable infrastructure flexibility, capturing leads via waitlist.

**Architecture:** Static Astro site with Tailwind CSS. One page (`index.astro`) composed of 9 Astro components — one per section. i18n via JSON locale files and a `data-lang` attribute on `<html>`. No client-side framework; interactivity (nav toggle, language switch, scroll reveals) via vanilla JS in `<script>` tags.

**Tech Stack:** Astro 5, Tailwind CSS 4, Inter font (Google Fonts), inline SVGs for icons.

**Spec:** `docs/superpowers/specs/2026-03-15-landing-page-design.md`

---

## File Map

| File | Responsibility |
|------|----------------|
| `astro.config.mjs` | Astro config (static output) |
| `tailwind.config.mjs` | Custom colors, fonts, extend theme |
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript config |
| `src/styles/global.css` | Tailwind directives + CSS custom properties + animations |
| `src/i18n/en.json` | All English copy |
| `src/i18n/es.json` | All Spanish copy |
| `src/i18n/t.ts` | Translation helper function |
| `src/layouts/Layout.astro` | HTML shell, head, fonts, scroll observer script |
| `src/pages/index.astro` | Assembles all section components |
| `src/components/Nav.astro` | Fixed nav + mobile hamburger + lang toggle |
| `src/components/Hero.astro` | Hero section with orbs, headline, CTAs |
| `src/components/ProblemSolution.astro` | 3-column problem→solution cards |
| `src/components/Capabilities.astro` | 2x2 feature cards grid |
| `src/components/ComposableInfra.astro` | 3 slots with swappable pill options |
| `src/components/SearchDemo.astro` | Mock search with typing animation + results |
| `src/components/UseCases.astro` | 3 persona cards |
| `src/components/CTAFinal.astro` | Waitlist email form |
| `src/components/Footer.astro` | Minimal footer |
| `.claude/CLAUDE.md` | Project context for future sessions |

---

## Chunk 1: Project Scaffold

### Task 1: Create Astro project and install dependencies

**Files:**
- Create: `D:\Documentos\Desktop\klay+landing\package.json`
- Create: `D:\Documentos\Desktop\klay+landing\astro.config.mjs`
- Create: `D:\Documentos\Desktop\klay+landing\tsconfig.json`

- [ ] **Step 1: Scaffold Astro project**

```bash
cd /d/Documentos/Desktop
mkdir klay+landing && cd klay+landing
npm create astro@latest -- . --template minimal --no-install --no-git --typescript strict
```

- [ ] **Step 2: Install dependencies**

```bash
cd "/d/Documentos/Desktop/klay+landing"
npm install astro @astrojs/tailwind tailwindcss
```

- [ ] **Step 3: Configure Astro**

Write `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
});
```

- [ ] **Step 4: Configure Tailwind**

Write `tailwind.config.mjs`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0a0f',
        'bg-secondary': '#1a1a2e',
        'bg-tertiary': '#16213e',
        'accent-primary': '#6366f1',
        'accent-secondary': '#8b5cf6',
        'accent-tertiary': '#c084fc',
        'text-primary': '#f1f5f9',
        'text-secondary': '#94a3b8',
        'text-muted': '#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 5: Verify dev server starts**

```bash
cd "/d/Documentos/Desktop/klay+landing"
npx astro dev
```

Expected: Dev server starts on localhost:4321 with no errors.

- [ ] **Step 6: Initialize git and commit**

```bash
cd "/d/Documentos/Desktop/klay+landing"
git init
echo "node_modules/\ndist/\n.astro/\n.superpowers/" > .gitignore
git add .
git commit -m "chore: scaffold Astro + Tailwind project"
```

---

### Task 2: Global styles, i18n, and Layout

**Files:**
- Create: `src/styles/global.css`
- Create: `src/i18n/en.json`
- Create: `src/i18n/es.json`
- Create: `src/i18n/t.ts`
- Create: `src/layouts/Layout.astro`

- [ ] **Step 1: Write global.css**

```css
@import 'tailwindcss';

/* Glass morphism utilities */
.glass {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
}

/* Gradient text utility */
.gradient-text {
  background: linear-gradient(135deg, #6366f1, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Scroll reveal */
[data-reveal] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}

[data-reveal].revealed {
  opacity: 1;
  transform: translateY(0);
}

/* Typing animation */
@keyframes typing {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes blink-cursor {
  from, to { border-color: transparent; }
  50% { border-color: #6366f1; }
}

.typing-text {
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid #6366f1;
  width: 0;
  animation:
    typing 3s steps(48, end) forwards,
    blink-cursor 0.75s step-end infinite;
}

/* Dot grid background */
.dot-grid {
  background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* i18n: hide elements not matching current lang */
html[data-lang="en"] [data-lang-es] { display: none; }
html[data-lang="es"] [data-lang-en] { display: none; }
```

- [ ] **Step 2: Write en.json**

```json
{
  "nav": {
    "features": "Features",
    "useCases": "Use Cases",
    "cta": "Get Early Access"
  },
  "hero": {
    "eyebrow": "Semantic Knowledge Platform",
    "headline": "Your documents hold the answers. We help you find them.",
    "subtitle": "Stop searching by keywords. Start finding by meaning. klay+ transforms your files into a knowledge base you can actually talk to.",
    "cta": "Get Early Access",
    "ctaSecondary": "See What It Can Do"
  },
  "problems": {
    "title": "Sound familiar?",
    "p1": {
      "title": "Search fails you",
      "problem": "You know the answer is in your files. But keyword search returns nothing — because you're not using the exact words the document used.",
      "solution": "klay+ searches by meaning. Ask 'how does authentication work?' and find the answer even if the doc says 'login flow'."
    },
    "p2": {
      "title": "Knowledge is scattered",
      "problem": "Your information lives across PDFs, markdown notes, text files. Related ideas are invisible to each other.",
      "solution": "klay+ connects everything into a unified knowledge base. One search across all your documents."
    },
    "p3": {
      "title": "Reconnecting takes hours",
      "problem": "Every time you need to find something, you re-read, re-scan, re-organize. Time you could spend on actual work.",
      "solution": "klay+ gives you instant recall. Ask and get answers in seconds, ranked by relevance."
    }
  },
  "capabilities": {
    "title": "What klay+ does for you",
    "c1": {
      "title": "Find by meaning",
      "desc": "Ask questions in natural language. klay+ understands what you mean, not just what you type. Get results ranked by semantic relevance."
    },
    "c2": {
      "title": "Connect scattered knowledge",
      "desc": "PDFs, Markdown, plain text — all unified into one searchable base. Find connections between documents you didn't know existed."
    },
    "c3": {
      "title": "Your files, your rules",
      "desc": "Everything runs on your machine. No data leaves your environment. No cloud dependency. No surprises."
    },
    "c4": {
      "title": "Adapt to your workflow",
      "desc": "Choose your storage, your embedding model, your processing strategy. klay+ adapts to your infrastructure, not the other way around."
    }
  },
  "infra": {
    "title": "Build the stack that works for you",
    "subtitle": "klay+ doesn't lock you into one way of doing things. Mix and match components to fit your needs.",
    "storage": "Where your data lives",
    "embedding": "How meaning is captured",
    "processing": "How content is prepared",
    "note": "More providers and strategies coming soon. The architecture is designed to grow with you."
  },
  "search": {
    "title": "See it in action",
    "query": "How does authentication work in our API?"
  },
  "useCases": {
    "title": "Built for people who think with documents",
    "worker": {
      "name": "Maria",
      "role": "Knowledge Worker",
      "story": "Maria manages 200+ reference documents. She used to spend 30 minutes finding the right paragraph. Now she asks klay+ and gets it in seconds."
    },
    "researcher": {
      "name": "Carlos",
      "role": "Researcher",
      "story": "Carlos collects papers across 5 different topics. klay+ finds connections between papers he never would have linked manually."
    },
    "developer": {
      "name": "Ana",
      "role": "Developer",
      "story": "Ana needs semantic search in her app. Instead of building from scratch with raw embeddings, she uses klay+ as her knowledge layer."
    }
  },
  "ctaFinal": {
    "headline": "Ready to unlock your knowledge?",
    "subtitle": "Join the waitlist and be the first to try klay+ when it launches.",
    "placeholder": "your@email.com",
    "button": "Join the Waitlist",
    "note": "No spam. We'll only email you when klay+ is ready."
  },
  "footer": {
    "copyright": "© 2026 klay+"
  }
}
```

- [ ] **Step 3: Write es.json**

```json
{
  "nav": {
    "features": "Capacidades",
    "useCases": "Casos de uso",
    "cta": "Acceso anticipado"
  },
  "hero": {
    "eyebrow": "Plataforma de Conocimiento Semántico",
    "headline": "Tus documentos tienen las respuestas. Te ayudamos a encontrarlas.",
    "subtitle": "Deja de buscar por palabras clave. Empieza a encontrar por significado. klay+ transforma tus archivos en una base de conocimiento con la que puedes conversar.",
    "cta": "Acceso anticipado",
    "ctaSecondary": "Descubre qué puede hacer"
  },
  "problems": {
    "title": "¿Te suena familiar?",
    "p1": {
      "title": "La búsqueda te falla",
      "problem": "Sabes que la respuesta está en tus archivos. Pero la búsqueda por palabras no encuentra nada — porque no estás usando las palabras exactas del documento.",
      "solution": "klay+ busca por significado. Pregunta 'cómo funciona la autenticación' y encuentra la respuesta aunque el documento diga 'flujo de login'."
    },
    "p2": {
      "title": "El conocimiento está disperso",
      "problem": "Tu información vive dispersa en PDFs, notas en markdown, archivos de texto. Las ideas relacionadas son invisibles entre sí.",
      "solution": "klay+ conecta todo en una base de conocimiento unificada. Una búsqueda en todos tus documentos."
    },
    "p3": {
      "title": "Reconectar toma horas",
      "problem": "Cada vez que necesitas encontrar algo, relees, repasas, reorganizas. Tiempo que podrías usar en trabajo real.",
      "solution": "klay+ te da acceso instantáneo. Pregunta y obtén respuestas en segundos, ordenadas por relevancia."
    }
  },
  "capabilities": {
    "title": "Lo que klay+ hace por ti",
    "c1": {
      "title": "Encuentra por significado",
      "desc": "Haz preguntas en lenguaje natural. klay+ entiende lo que quieres decir, no solo lo que escribes. Obtén resultados ordenados por relevancia semántica."
    },
    "c2": {
      "title": "Conecta conocimiento disperso",
      "desc": "PDFs, Markdown, texto plano — todo unificado en una base buscable. Encuentra conexiones entre documentos que no sabías que existían."
    },
    "c3": {
      "title": "Tus archivos, tus reglas",
      "desc": "Todo corre en tu máquina. Tus datos no salen de tu entorno. Sin dependencia de la nube. Sin sorpresas."
    },
    "c4": {
      "title": "Se adapta a tu flujo de trabajo",
      "desc": "Elige tu almacenamiento, tu modelo de embeddings, tu estrategia de procesamiento. klay+ se adapta a tu infraestructura, no al revés."
    }
  },
  "infra": {
    "title": "Arma el stack que funcione para ti",
    "subtitle": "klay+ no te encierra en una sola forma de hacer las cosas. Combina componentes según tus necesidades.",
    "storage": "Donde viven tus datos",
    "embedding": "Cómo se captura el significado",
    "processing": "Cómo se prepara el contenido",
    "note": "Más proveedores y estrategias próximamente. La arquitectura está diseñada para crecer contigo."
  },
  "search": {
    "title": "Míralo en acción",
    "query": "¿Cómo funciona la autenticación en nuestra API?"
  },
  "useCases": {
    "title": "Diseñado para personas que piensan con documentos",
    "worker": {
      "name": "María",
      "role": "Knowledge Worker",
      "story": "María maneja más de 200 documentos de referencia. Antes pasaba 30 minutos buscando el párrafo correcto. Ahora le pregunta a klay+ y lo obtiene en segundos."
    },
    "researcher": {
      "name": "Carlos",
      "role": "Investigador",
      "story": "Carlos recopila papers de 5 temas distintos. klay+ encuentra conexiones entre papers que él nunca habría vinculado manualmente."
    },
    "developer": {
      "name": "Ana",
      "role": "Desarrolladora",
      "story": "Ana necesita búsqueda semántica en su app. En lugar de construir desde cero con embeddings crudos, usa klay+ como su capa de conocimiento."
    }
  },
  "ctaFinal": {
    "headline": "Desbloquea tu conocimiento",
    "subtitle": "Únete a la lista de espera y prueba klay+ antes que nadie.",
    "placeholder": "tu@email.com",
    "button": "Unirme a la lista",
    "note": "Sin spam. Solo te escribiremos cuando klay+ esté listo."
  },
  "footer": {
    "copyright": "© 2026 klay+"
  }
}
```

- [ ] **Step 4: Write i18n helper**

Write `src/i18n/t.ts`:

```typescript
import en from './en.json';
import es from './es.json';

const locales: Record<string, typeof en> = { en, es };

export function t(key: string, lang: string = 'en'): string {
  const locale = locales[lang] || en;
  return key.split('.').reduce((obj: any, k) => obj?.[k], locale) ?? key;
}

export function getLocaleData(lang: string = 'en') {
  return locales[lang] || en;
}
```

- [ ] **Step 5: Write Layout.astro**

```astro
---
interface Props {
  title?: string;
}
const { title = 'klay+ — Semantic Knowledge Platform' } = Astro.props;
---
<!doctype html>
<html lang="en" data-lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Transform your documents into a semantically searchable knowledge base. Find information by meaning, not keywords." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <title>{title}</title>
  </head>
  <body class="bg-bg-primary text-text-secondary font-sans antialiased overflow-x-hidden">
    <slot />
    <script>
      // Language toggle
      const savedLang = localStorage.getItem('klay-lang') || 'en';
      document.documentElement.setAttribute('data-lang', savedLang);

      window.toggleLang = function() {
        const current = document.documentElement.getAttribute('data-lang');
        const next = current === 'en' ? 'es' : 'en';
        document.documentElement.setAttribute('data-lang', next);
        localStorage.setItem('klay-lang', next);
      };

      // Scroll reveal
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    </script>
  </body>
</html>
```

- [ ] **Step 6: Commit**

```bash
git add src/styles src/i18n src/layouts
git commit -m "feat: add global styles, i18n locale files, and base layout"
```

---

## Chunk 2: Navigation + Hero + Problem/Solution

### Task 3: Navigation component

**Files:**
- Create: `src/components/Nav.astro`

- [ ] **Step 1: Write Nav.astro**

```astro
---
import { getLocaleData } from '../i18n/t';
const en = getLocaleData('en');
const es = getLocaleData('es');
---
<nav id="site-nav" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
  <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
    <!-- Logo -->
    <a href="#" class="text-xl font-bold gradient-text">klay+</a>

    <!-- Desktop links -->
    <div class="hidden sm:flex items-center gap-8">
      <a href="#capabilities" class="text-text-secondary hover:text-text-primary transition-colors text-sm">
        <span data-lang-en>{en.nav.features}</span>
        <span data-lang-es>{es.nav.features}</span>
      </a>
      <a href="#use-cases" class="text-text-secondary hover:text-text-primary transition-colors text-sm">
        <span data-lang-en>{en.nav.useCases}</span>
        <span data-lang-es>{es.nav.useCases}</span>
      </a>

      <!-- Lang toggle -->
      <button onclick="toggleLang()" class="text-xs px-3 py-1 rounded-full border border-white/10 text-text-muted hover:text-text-primary transition-colors">
        <span data-lang-en>ES</span>
        <span data-lang-es>EN</span>
      </button>

      <!-- CTA -->
      <a href="#waitlist" class="bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
        <span data-lang-en>{en.nav.cta}</span>
        <span data-lang-es>{es.nav.cta}</span>
      </a>
    </div>

    <!-- Mobile hamburger -->
    <button id="menu-toggle" class="sm:hidden text-text-primary p-2" aria-label="Toggle menu">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path id="menu-icon" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  </div>

  <!-- Mobile overlay -->
  <div id="mobile-menu" class="sm:hidden fixed inset-0 bg-bg-primary/95 backdrop-blur-lg flex flex-col items-center justify-center gap-8 hidden z-40">
    <a href="#capabilities" class="text-lg text-text-primary" onclick="closeMobileMenu()">
      <span data-lang-en>{en.nav.features}</span>
      <span data-lang-es>{es.nav.features}</span>
    </a>
    <a href="#use-cases" class="text-lg text-text-primary" onclick="closeMobileMenu()">
      <span data-lang-en>{en.nav.useCases}</span>
      <span data-lang-es>{es.nav.useCases}</span>
    </a>
    <button onclick="toggleLang()" class="text-sm px-4 py-2 rounded-full border border-white/10 text-text-muted">
      <span data-lang-en>Cambiar a Español</span>
      <span data-lang-es>Switch to English</span>
    </button>
    <a href="#waitlist" class="bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-semibold px-6 py-3 rounded-lg" onclick="closeMobileMenu()">
      <span data-lang-en>{en.nav.cta}</span>
      <span data-lang-es>{es.nav.cta}</span>
    </a>
  </div>
</nav>

<script>
  // Nav background on scroll
  const nav = document.getElementById('site-nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav?.classList.add('bg-bg-primary/80', 'backdrop-blur-lg', 'border-b', 'border-white/5');
    } else {
      nav?.classList.remove('bg-bg-primary/80', 'backdrop-blur-lg', 'border-b', 'border-white/5');
    }
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  menuToggle?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('hidden');
  });
  window.closeMobileMenu = function() {
    mobileMenu?.classList.add('hidden');
  };
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Nav.astro
git commit -m "feat: add navigation with mobile menu and lang toggle"
```

---

### Task 4: Hero component

**Files:**
- Create: `src/components/Hero.astro`

- [ ] **Step 1: Write Hero.astro**

```astro
---
import { getLocaleData } from '../i18n/t';
const en = getLocaleData('en');
const es = getLocaleData('es');
---
<section class="relative min-h-screen flex items-center justify-center dot-grid overflow-hidden">
  <!-- Gradient orbs -->
  <div class="absolute top-1/4 -left-32 w-96 h-96 bg-accent-primary/20 rounded-full blur-[128px]"></div>
  <div class="absolute bottom-1/4 -right-32 w-80 h-80 bg-accent-secondary/15 rounded-full blur-[128px]"></div>

  <div class="relative z-10 max-w-4xl mx-auto px-6 text-center pt-24">
    <!-- Eyebrow -->
    <p class="text-accent-tertiary text-xs font-semibold tracking-[0.2em] uppercase mb-6" data-reveal>
      <span data-lang-en>{en.hero.eyebrow}</span>
      <span data-lang-es>{es.hero.eyebrow}</span>
    </p>

    <!-- Headline -->
    <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight mb-6" data-reveal>
      <span data-lang-en>{en.hero.headline}</span>
      <span data-lang-es>{es.hero.headline}</span>
    </h1>

    <!-- Subtitle -->
    <p class="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10" data-reveal>
      <span data-lang-en>{en.hero.subtitle}</span>
      <span data-lang-es>{es.hero.subtitle}</span>
    </p>

    <!-- CTAs -->
    <div class="flex flex-col sm:flex-row gap-4 justify-center" data-reveal>
      <a href="#waitlist" class="bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity text-base">
        <span data-lang-en>{en.hero.cta}</span>
        <span data-lang-es>{es.hero.cta}</span>
      </a>
      <a href="#capabilities" class="border border-white/15 text-text-primary font-medium px-8 py-3 rounded-lg hover:bg-white/5 transition-colors text-base">
        <span data-lang-en>{en.hero.ctaSecondary}</span>
        <span data-lang-es>{es.hero.ctaSecondary}</span>
      </a>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: add hero section with gradient orbs and CTAs"
```

---

### Task 5: Problem → Solution component

**Files:**
- Create: `src/components/ProblemSolution.astro`

- [ ] **Step 1: Write ProblemSolution.astro**

```astro
---
import { getLocaleData } from '../i18n/t';
const en = getLocaleData('en');
const es = getLocaleData('es');

const problems = [
  { key: 'p1', icon: '🔍' },
  { key: 'p2', icon: '📂' },
  { key: 'p3', icon: '⏳' },
] as const;
---
<section class="py-24 px-6">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-16" data-reveal>
      <span data-lang-en>{en.problems.title}</span>
      <span data-lang-es>{es.problems.title}</span>
    </h2>

    <div class="grid md:grid-cols-3 gap-8">
      {problems.map(({ key, icon }) => (
        <div class="glass rounded-2xl p-8" data-reveal>
          <div class="text-3xl mb-4">{icon}</div>

          <!-- Problem -->
          <h3 class="text-lg font-semibold text-amber-400/90 mb-3">
            <span data-lang-en>{(en.problems as any)[key].title}</span>
            <span data-lang-es>{(es.problems as any)[key].title}</span>
          </h3>
          <p class="text-text-muted text-sm mb-6 leading-relaxed">
            <span data-lang-en>{(en.problems as any)[key].problem}</span>
            <span data-lang-es>{(es.problems as any)[key].problem}</span>
          </p>

          <!-- Arrow -->
          <div class="w-8 h-px bg-gradient-to-r from-amber-400/50 to-accent-primary mb-6"></div>

          <!-- Solution -->
          <p class="text-text-primary text-sm leading-relaxed">
            <span data-lang-en>{(en.problems as any)[key].solution}</span>
            <span data-lang-es>{(es.problems as any)[key].solution}</span>
          </p>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ProblemSolution.astro
git commit -m "feat: add problem/solution section with glass cards"
```

---

## Chunk 3: Capabilities + Composable Infra + Search Demo

### Task 6: Capabilities component

**Files:**
- Create: `src/components/Capabilities.astro`

- [ ] **Step 1: Write Capabilities.astro**

```astro
---
import { getLocaleData } from '../i18n/t';
const en = getLocaleData('en');
const es = getLocaleData('es');

const capabilities = [
  { key: 'c1', icon: `<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8" stroke-width="1.5"/><path stroke-linecap="round" stroke-width="1.5" d="m21 21-4.35-4.35"/><path stroke-linecap="round" stroke-width="1.5" d="M8 11h6M11 8v6" opacity="0.5"/></svg>` },
  { key: 'c2', icon: `<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="6" cy="6" r="2" stroke-width="1.5"/><circle cx="18" cy="6" r="2" stroke-width="1.5"/><circle cx="12" cy="18" r="2" stroke-width="1.5"/><path stroke-linecap="round" stroke-width="1.5" d="M8 6h8M7 8l4 8M17 8l-4 8"/></svg>` },
  { key: 'c3', icon: `<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path stroke-linecap="round" stroke-width="1.5" d="M9 12l2 2 4-4"/></svg>` },
  { key: 'c4', icon: `<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke-width="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke-width="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke-width="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke-width="1.5" opacity="0.5" stroke-dasharray="2 2"/></svg>` },
];
---
<section id="capabilities" class="py-24 px-6">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-16" data-reveal>
      <span data-lang-en>{en.capabilities.title}</span>
      <span data-lang-es>{es.capabilities.title}</span>
    </h2>

    <div class="grid sm:grid-cols-2 gap-6">
      {capabilities.map(({ key, icon }) => (
        <div class="glass rounded-2xl p-8 hover:bg-white/[0.07] transition-colors" data-reveal>
          <div class="text-accent-primary mb-4" set:html={icon} />
          <h3 class="text-lg font-semibold text-text-primary mb-3">
            <span data-lang-en>{(en.capabilities as any)[key].title}</span>
            <span data-lang-es>{(es.capabilities as any)[key].title}</span>
          </h3>
          <p class="text-text-secondary text-sm leading-relaxed">
            <span data-lang-en>{(en.capabilities as any)[key].desc}</span>
            <span data-lang-es>{(es.capabilities as any)[key].desc}</span>
          </p>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Capabilities.astro
git commit -m "feat: add capabilities section with 2x2 glass cards"
```

---

### Task 7: Composable Infrastructure component

**Files:**
- Create: `src/components/ComposableInfra.astro`

- [ ] **Step 1: Write ComposableInfra.astro**

```astro
---
import { getLocaleData } from '../i18n/t';
const en = getLocaleData('en');
const es = getLocaleData('es');

const slots = [
  {
    labelKey: 'storage',
    options: ['Local (NeDB)', 'Browser (IndexedDB)', 'In-Memory'],
    activeIndex: 0,
  },
  {
    labelKey: 'embedding',
    options: ['OpenAI', 'Cohere', 'WebLLM (local)', 'Hash'],
    activeIndex: 0,
  },
  {
    labelKey: 'processing',
    options: ['Recursive', 'Sentence-aware', 'Fixed-size'],
    activeIndex: 0,
  },
];
---
<section class="py-24 px-6 relative overflow-hidden">
  <!-- Background glow -->
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent-tertiary/5 rounded-full blur-[128px]"></div>

  <div class="relative z-10 max-w-6xl mx-auto">
    <h2 class="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-4" data-reveal>
      <span data-lang-en>{en.infra.title}</span>
      <span data-lang-es>{es.infra.title}</span>
    </h2>
    <p class="text-text-secondary text-center max-w-2xl mx-auto mb-16" data-reveal>
      <span data-lang-en>{en.infra.subtitle}</span>
      <span data-lang-es>{es.infra.subtitle}</span>
    </p>

    <div class="grid md:grid-cols-3 gap-6">
      {slots.map(({ labelKey, options, activeIndex }) => (
        <div class="glass rounded-2xl p-6" data-reveal>
          <p class="text-text-muted text-xs font-semibold tracking-wider uppercase mb-4">
            <span data-lang-en>{(en.infra as any)[labelKey]}</span>
            <span data-lang-es>{(es.infra as any)[labelKey]}</span>
          </p>
          <div class="flex flex-wrap gap-2">
            {options.map((opt, i) => (
              <span class={`text-xs px-3 py-1.5 rounded-full transition-colors cursor-default ${
                i === activeIndex
                  ? 'bg-accent-primary/20 text-accent-tertiary border border-accent-primary/30'
                  : 'bg-white/5 text-text-muted border border-white/5'
              }`}>
                {opt}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>

    <!-- Connecting line visual -->
    <div class="hidden md:flex justify-center mt-8" data-reveal>
      <div class="flex items-center gap-2 text-text-muted text-xs">
        <div class="w-16 h-px bg-gradient-to-r from-transparent to-accent-primary/30"></div>
        <span>+</span>
        <div class="w-16 h-px bg-gradient-to-r from-accent-primary/30 to-accent-secondary/30"></div>
        <span>+</span>
        <div class="w-16 h-px bg-gradient-to-r from-accent-secondary/30 to-transparent"></div>
        <span class="text-accent-tertiary ml-2">= your pipeline</span>
      </div>
    </div>

    <p class="text-text-muted text-sm text-center mt-8" data-reveal>
      <span data-lang-en>{en.infra.note}</span>
      <span data-lang-es>{es.infra.note}</span>
    </p>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ComposableInfra.astro
git commit -m "feat: add composable infrastructure section with slot pills"
```

---

### Task 8: Search Demo component

**Files:**
- Create: `src/components/SearchDemo.astro`

- [ ] **Step 1: Write SearchDemo.astro**

```astro
---
import { getLocaleData } from '../i18n/t';
const en = getLocaleData('en');
const es = getLocaleData('es');

const results = [
  { file: 'api-auth-guide.md', section: 'Section 3.2: "Authentication Flow"', match: 98, snippet: 'The API uses JWT tokens for authentication. Each request must include a Bearer token in the Authorization header...' },
  { file: 'security-overview.pdf', section: 'Page 12: "Access Control"', match: 91, snippet: 'Access control is enforced at the gateway level. Role-based permissions determine which endpoints a user can reach...' },
  { file: 'dev-notes.md', section: '"Login Implementation Notes"', match: 84, snippet: 'The login flow validates credentials against the user store, generates a session token, and sets an httpOnly cookie...' },
];
---
<section class="py-24 px-6">
  <div class="max-w-4xl mx-auto">
    <h2 class="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-16" data-reveal>
      <span data-lang-en>{en.search.title}</span>
      <span data-lang-es>{es.search.title}</span>
    </h2>

    <div class="glass rounded-2xl p-8" data-reveal>
      <!-- Search input mockup -->
      <div class="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
        <svg class="w-5 h-5 text-accent-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="11" cy="11" r="8" stroke-width="1.5"/>
          <path stroke-linecap="round" stroke-width="1.5" d="m21 21-4.35-4.35"/>
        </svg>
        <div class="text-text-primary text-sm">
          <span class="typing-text inline-block" data-lang-en>{en.search.query}</span>
          <span class="typing-text inline-block" data-lang-es>{es.search.query}</span>
        </div>
      </div>

      <!-- Results -->
      <div class="space-y-4">
        {results.map(({ file, section, match, snippet }) => (
          <div class="bg-white/[0.03] rounded-xl p-5 border border-white/5 hover:border-accent-primary/20 transition-colors">
            <div class="flex items-start justify-between gap-4 mb-2">
              <div>
                <span class="text-text-primary text-sm font-medium">{file}</span>
                <span class="text-text-muted text-xs ml-2">— {section}</span>
              </div>
              <span class={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                match >= 95 ? 'bg-green-500/15 text-green-400' :
                match >= 90 ? 'bg-accent-primary/15 text-accent-tertiary' :
                'bg-amber-500/15 text-amber-400'
              }`}>
                {match}%
              </span>
            </div>
            <p class="text-text-muted text-xs leading-relaxed">{snippet}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SearchDemo.astro
git commit -m "feat: add search demo section with typing animation and results"
```

---

## Chunk 4: Use Cases + CTA + Footer + Assembly

### Task 9: Use Cases component

**Files:**
- Create: `src/components/UseCases.astro`

- [ ] **Step 1: Write UseCases.astro**

```astro
---
import { getLocaleData } from '../i18n/t';
const en = getLocaleData('en');
const es = getLocaleData('es');

const personas = [
  { key: 'worker', emoji: '📋' },
  { key: 'researcher', emoji: '🔬' },
  { key: 'developer', emoji: '💻' },
] as const;
---
<section id="use-cases" class="py-24 px-6">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-16" data-reveal>
      <span data-lang-en>{en.useCases.title}</span>
      <span data-lang-es>{es.useCases.title}</span>
    </h2>

    <div class="grid md:grid-cols-3 gap-8">
      {personas.map(({ key, emoji }) => (
        <div class="glass rounded-2xl p-8 text-center" data-reveal>
          <div class="text-4xl mb-4">{emoji}</div>
          <h3 class="text-lg font-semibold text-text-primary mb-1">
            <span data-lang-en>{(en.useCases as any)[key].name}</span>
            <span data-lang-es>{(es.useCases as any)[key].name}</span>
          </h3>
          <p class="text-accent-tertiary text-xs font-medium uppercase tracking-wider mb-4">
            <span data-lang-en>{(en.useCases as any)[key].role}</span>
            <span data-lang-es>{(es.useCases as any)[key].role}</span>
          </p>
          <p class="text-text-secondary text-sm leading-relaxed">
            <span data-lang-en>{(en.useCases as any)[key].story}</span>
            <span data-lang-es>{(es.useCases as any)[key].story}</span>
          </p>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/UseCases.astro
git commit -m "feat: add use cases section with persona cards"
```

---

### Task 10: CTA Final component

**Files:**
- Create: `src/components/CTAFinal.astro`

- [ ] **Step 1: Write CTAFinal.astro**

```astro
---
import { getLocaleData } from '../i18n/t';
const en = getLocaleData('en');
const es = getLocaleData('es');

const formAction = import.meta.env.PUBLIC_FORM_ACTION || '#';
---
<section id="waitlist" class="py-24 px-6 border-t border-accent-primary/20">
  <div class="max-w-xl mx-auto text-center">
    <h2 class="text-3xl sm:text-4xl font-bold text-text-primary mb-4" data-reveal>
      <span data-lang-en>{en.ctaFinal.headline}</span>
      <span data-lang-es>{es.ctaFinal.headline}</span>
    </h2>
    <p class="text-text-secondary mb-10" data-reveal>
      <span data-lang-en>{en.ctaFinal.subtitle}</span>
      <span data-lang-es>{es.ctaFinal.subtitle}</span>
    </p>

    <form action={formAction} method="POST" class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" data-reveal>
      <input
        type="email"
        name="email"
        required
        class="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 transition-colors"
        placeholder={en.ctaFinal.placeholder}
      />
      <button type="submit" class="bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm whitespace-nowrap">
        <span data-lang-en>{en.ctaFinal.button}</span>
        <span data-lang-es>{es.ctaFinal.button}</span>
      </button>
    </form>

    <p class="text-text-muted text-xs mt-4" data-reveal>
      <span data-lang-en>{en.ctaFinal.note}</span>
      <span data-lang-es>{es.ctaFinal.note}</span>
    </p>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CTAFinal.astro
git commit -m "feat: add CTA final section with waitlist email form"
```

---

### Task 11: Footer component

**Files:**
- Create: `src/components/Footer.astro`

- [ ] **Step 1: Write Footer.astro**

```astro
---
import { getLocaleData } from '../i18n/t';
const en = getLocaleData('en');
---
<footer class="py-12 px-6 border-t border-white/5">
  <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
    <span class="text-sm font-bold gradient-text">klay+</span>
    <div class="flex items-center gap-6 text-text-muted text-xs">
      <a href="https://github.com" class="hover:text-text-primary transition-colors">GitHub</a>
      <span>{en.footer.copyright}</span>
    </div>
  </div>
</footer>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat: add minimal footer"
```

---

### Task 12: Assemble index page

**Files:**
- Create: `src/pages/index.astro`

- [ ] **Step 1: Write index.astro**

```astro
---
import Layout from '../layouts/Layout.astro';
import Nav from '../components/Nav.astro';
import Hero from '../components/Hero.astro';
import ProblemSolution from '../components/ProblemSolution.astro';
import Capabilities from '../components/Capabilities.astro';
import ComposableInfra from '../components/ComposableInfra.astro';
import SearchDemo from '../components/SearchDemo.astro';
import UseCases from '../components/UseCases.astro';
import CTAFinal from '../components/CTAFinal.astro';
import Footer from '../components/Footer.astro';
---
<Layout>
  <Nav />
  <Hero />
  <ProblemSolution />
  <Capabilities />
  <ComposableInfra />
  <SearchDemo />
  <UseCases />
  <CTAFinal />
  <Footer />
</Layout>
```

- [ ] **Step 2: Run dev server and verify**

```bash
cd "/d/Documentos/Desktop/klay+landing"
npx astro dev
```

Open http://localhost:4321 and verify:
- All 9 sections render
- Dark theme applies
- Scroll reveal animations trigger
- Language toggle switches EN/ES
- Mobile nav works at <640px
- Typing animation runs in search demo
- Gradient orbs visible in hero

- [ ] **Step 3: Run production build**

```bash
cd "/d/Documentos/Desktop/klay+landing"
npx astro build
```

Expected: Build succeeds with static output in `dist/`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: assemble landing page with all sections"
```

---

### Task 13: CLAUDE.md for the landing project

**Files:**
- Create: `.claude/CLAUDE.md`

- [ ] **Step 1: Write CLAUDE.md**

```markdown
# klay+ Landing Page

Product-focused landing page for the klay+ Semantic Knowledge Platform.

## Commands

```bash
npm run dev          # Astro dev server (localhost:4321)
npm run build        # Production build to dist/
npm run preview      # Preview production build
```

## Stack

- Astro 5 (static output)
- Tailwind CSS 4
- Inter font (Google Fonts)
- No client-side framework — vanilla JS for interactivity

## Structure

```
src/
  components/    # One Astro component per landing section
  layouts/       # Layout.astro (HTML shell + scroll observer)
  pages/         # index.astro (assembles sections)
  i18n/          # en.json, es.json, t.ts helper
  styles/        # global.css (Tailwind + custom CSS)
```

## i18n

Bilingual EN/ES via `data-lang` attribute on `<html>`.
- Components render both languages, CSS hides the inactive one
- Toggle stores preference in `localStorage`
- Copy lives in `src/i18n/en.json` and `src/i18n/es.json`

## Lead Capture

Form action uses `PUBLIC_FORM_ACTION` env var (Formspree URL).
Fallback: `#` (no-op in dev).

## Design Spec

Full spec: `../klay+/docs/superpowers/specs/2026-03-15-landing-page-design.md`
```

- [ ] **Step 2: Commit**

```bash
git add .claude/CLAUDE.md
git commit -m "docs: add CLAUDE.md project context"
```
