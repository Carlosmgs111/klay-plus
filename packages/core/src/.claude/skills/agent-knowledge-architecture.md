# Agent Knowledge Architecture Skill

## Descripcion

Guia para crear documentacion jerarquica CLAUDE.md que permite a agentes AI comprender la arquitectura, capacidades y estructura de un proyecto DDD/monolito modular. Define 4 niveles de documentacion (Producto, Contexto, Modulo, Aplicacion), templates para cada uno, y reglas para mantener coherencia entre niveles.

---

## 0. Proposito y Filosofia

### 0.1 Por que CLAUDE.md

Los archivos CLAUDE.md son **knowledge para agentes AI**, no documentacion para humanos. Su proposito es que un agente pueda:

- Entender que hace el sistema sin leer el codigo fuente
- Navegar la arquitectura top-down (producto → contexto → modulo)
- Saber que operaciones expone cada bounded context
- Tomar decisiones de diseno coherentes con la arquitectura existente

### 0.2 Principio de Capas

Cada nivel documenta **solo su alcance** y apunta al siguiente nivel para detalle:

```
Producto        ← Vision global, catalogo de contextos, flujo end-to-end
  |
  v
Contexto        ← Service, operaciones, composicion, lista de modulos
  |
  v
Modulo          ← Aggregate, value objects, eventos, use cases, ports, implementaciones
  |
  v
Aplicacion      ← Orquestacion cross-context, port, use cases internos, manifest
```

**Regla**: La informacion fluye hacia abajo. Si un nivel superior necesita un detalle, incluye un link "Ver detalle" al nivel inferior. Nunca duplica el contenido.

### 0.3 Declarativo, no Procedural

Los CLAUDE.md describen **QUE hace** cada componente, no **COMO implementarlo**. Evitar code snippets (excepto diagramas ASCII de flujo/composicion). El agente que necesite implementar consultara el skill de DDD Context Design para patrones de codigo.

---

## 1. Jerarquia de Documentacion

### 1.1 Arbol de Niveles

```
proyecto/
├── .claude/CLAUDE.md                              ← Nivel Producto
├── contexts/
│   ├── {context-name}/
│   │   ├── CLAUDE.md                              ← Nivel Contexto
│   │   ├── {module-a}/CLAUDE.md                   ← Nivel Modulo
│   │   └── {module-b}/CLAUDE.md                   ← Nivel Modulo
│   └── ...
└── application/
    └── {app-name}/CLAUDE.md                       ← Nivel Aplicacion
```

### 1.2 Tabla de Niveles

| Nivel | Ubicacion | Audiencia | Contenido principal |
|-------|-----------|-----------|-------------------|
| **Producto** | `.claude/CLAUDE.md` | Agente que necesita vision global | Vision, arquitectura general, catalogo de contextos, flujo E2E, eventos |
| **Contexto** | `contexts/{name}/CLAUDE.md` | Agente trabajando en un bounded context | Subdominio, service + operaciones, composicion, lista de modulos con resumen |
| **Modulo** | `contexts/{name}/{module}/CLAUDE.md` | Agente trabajando en un modulo | Aggregate, value objects, eventos, use cases, ports, implementaciones |
| **Aplicacion** | `application/{name}/CLAUDE.md` | Agente trabajando en orquestacion | Rol, port, orchestrator, use cases internos, manifest, flujo E2E |

---

## 2. Nivel Producto (`.claude/CLAUDE.md`)

### 2.1 Template

```markdown
# {Proyecto} — Product Capabilities

## Vision

{Descripcion de 2-3 lineas de que hace el producto y cual es su pipeline principal.}

## Arquitectura General

{Diagrama ASCII del arbol de carpetas de primer nivel con descripcion de cada una.}

## Bounded Contexts (Subdominios)

{Para cada contexto:}

### N. {Nombre del Contexto} (`contexts/{name}/`)
> **Subdominio**: {Una linea describiendo el subdominio}

{Parrafo de 2-3 lineas sobre responsabilidad del contexto.}

**Modulos**: `modulo-a`, `modulo-b`, ...
**Service**: `{ContextName}Service` — {descripcion breve de que expone}
**Ver**: `contexts/{name}/CLAUDE.md`

## Application Layer (`application/`)

### {Nombre Aplicacion} (`application/{name}/`) — [Ver detalle](ruta/relativa/CLAUDE.md)
> **No es un bounded context** — es la capa de orquestacion

{Descripcion de que coordina y que API expone.}

**Operaciones**:
- `operacion1` — descripcion
- `operacion2` — descripcion

## Platform (`platform/`)

{Infraestructura compartida: config, persistence, eventing, etc.}

## Shared Kernel (`shared/`)

{Building blocks: AggregateRoot, Result, ValueObject, etc.}

## Flujo de Datos End-to-End

{Diagrama ASCII del pipeline completo.}

## Catalogo de Eventos de Dominio

| Contexto | Evento | Significado |
|----------|--------|-------------|
| ... | ... | ... |
```

### 2.2 Secciones Obligatorias

- Vision
- Arquitectura General (ASCII tree)
- Bounded Contexts (con service y link a detalle)
- Application Layer (con operaciones)
- Flujo de Datos End-to-End (ASCII)
- Catalogo de Eventos

### 2.3 Que NO incluir en Nivel Producto

- Detalles de aggregate root o value objects (eso va en modulo)
- Operaciones individuales del service con tabla completa (eso va en contexto)
- Code snippets de implementacion
- Detalles de composicion o policies de infraestructura

---

## 3. Nivel Contexto (`contexts/{name}/CLAUDE.md`)

### 3.1 Template

```markdown
# {Nombre del Contexto} — Bounded Context

## Subdominio

{Descripcion del subdominio en 2-3 lineas. Que problema resuelve y cual es su rol
en el sistema.}

## Service: `{ContextName}Service`

{Rol del service en una linea.}

### Capacidades expuestas

| Operacion | Descripcion | Modulos involucrados |
|-----------|-------------|---------------------|
| `operacion1` | Que hace | modulo-a, modulo-b |
| `operacion2` | Que hace | modulo-a |

### Composicion

{Diagrama ASCII del composer y que factories compone.}

### Cross-Context Wiring (si aplica)

{Descripcion de dependencias cross-context y como se resuelven.}

---

## Modulos

### 1. {Nombre Modulo} (`{modulo}/`) — [Ver detalle]({modulo}/CLAUDE.md)

**Responsabilidad**: {Una linea.}

**Aggregate Root**: `{Aggregate}`
- {Detalle minimo: campos principales o ciclo de vida}

**Value Objects**: `VO1`, `VO2`, ...

**Eventos**:
- `Evento1` — significado
- `Evento2` — significado

**Use Cases**: `UC1`, `UC2`

**Ports**: `Port1`, `Port2`

**Implementaciones de {Port}**: `Impl1`, `Impl2`

---

{Repetir para cada modulo}

## {Seccion adicional de contexto si aplica}

{Ej: Tipos soportados, estrategias disponibles, nota de simetria, etc.}
```

### 3.2 Secciones Obligatorias

- Subdominio
- Service con tabla de operaciones
- Composicion (ASCII)
- Modulos (con resumen + link "Ver detalle")

### 3.3 Reglas: Que va en Contexto vs Modulo

```
CONTEXTO                                    MODULO
─────────────────────────────────────────────────────────────────
Tabla de operaciones del Service             Detalle de cada use case
Resumen de aggregate (campos clave)         Todas las propiedades del aggregate
Lista de value objects (nombres)            Tabla de value objects con descripcion
Lista de eventos (nombre + significado)     Tabla de eventos con campos
Nombres de ports                            Tabla de ports con responsabilidad
Nombres de implementaciones                 Tabla de implementaciones con entorno
Diagrama de composicion                     Nota de diseno si aplica
Cross-context wiring                        Pipeline interno del use case
```

---

## 4. Nivel Modulo (`contexts/{name}/{module}/CLAUDE.md`)

### 4.1 Template Standard (con Aggregate persistible)

```markdown
# {Nombre Modulo} — Module

## Responsabilidad

{Descripcion de 2-3 lineas. Que hace este modulo y que NO hace (si la distincion
es relevante).}

## Aggregate Root: `{Aggregate}`

Constructor privado + `create()` / `reconstitute()`.

**Propiedades**:
- `campo1` — descripcion
- `campo2` — `TipoVO`
- `campo3` — getter derivado

**Ciclo de vida**: {Estado1} -> {Estado2} -> {Estado3} / {Estado4}

## Value Objects

| Value Object | Descripcion |
|-------------|-------------|
| `{Aggregate}Id` | Identidad unica |
| `VO1` | Descripcion |
| `VO2` | Enum: `A`, `B`, `C` |

## Eventos de Dominio

| Evento | Significado |
|--------|-------------|
| `{Aggregate}{PastVerb}` | Cuando ocurre |
| `{Aggregate}{PastVerb}` | Cuando ocurre |

## Use Cases

| Use Case | Descripcion |
|----------|-------------|
| `{Verb}{Noun}` | Que hace |

### Pipeline de {UseCasePrincipal} (si el use case tiene flujo complejo)

{Diagrama ASCII del pipeline interno.}

## Ports

| Port | Responsabilidad |
|------|----------------|
| `{Aggregate}Repository` | CRUD + queries de dominio |
| `{Port}` | Descripcion de responsabilidad |

## Implementaciones de {Port}

| Implementacion | Entorno |
|---------------|---------|
| `InMemory{Impl}` | Testing/desarrollo |
| `IndexedDB{Impl}` | Browser |
| `NeDB{Impl}` | Server |

{Repetir tabla para cada port con multiples implementaciones.}

## Nota de Diseno (opcional)

{Decisiones arquitectonicas, relacion con otros modulos, aclaraciones.}
```

### 4.2 Template para Modulo Read-Only (sin Aggregate persistible)

Cuando un modulo no tiene aggregate persistible ni emite domain events (ej: queries, read models):

```markdown
# {Nombre Modulo} — Module

## Responsabilidad

{Descripcion. Mencionar que es un modulo de solo lectura si aplica.}

## Objetos de Dominio (transientes, no persistidos)

| Objeto | Tipo | Descripcion |
|--------|------|-------------|
| `Obj1` | Value Object | Descripcion |
| `Obj2` | Value Object | Descripcion |

## Use Cases

| Use Case | Descripcion |
|----------|-------------|
| `{UseCaseName}` | Que hace |

### Pipeline de {UseCaseName}

{Diagrama ASCII del pipeline.}

## Ports

| Port | Responsabilidad |
|------|----------------|
| `Port1` | Descripcion |
| `Port2` | Descripcion |

## Implementaciones de {Port}

| Implementacion | Entorno | Descripcion |
|---------------|---------|-------------|
| `Impl1` | Testing | Descripcion |
| `Impl2` | Server | Descripcion |
| `Impl3` | Browser | Descripcion |

## {Requisito Critico / Nota Especial} (si aplica)

{Ej: simetria de embeddings, dependencia de configuracion, etc.}
```

### 4.3 Secciones Obligatorias

Para modulo standard:
- Responsabilidad
- Aggregate Root (con propiedades y ciclo de vida)
- Value Objects (tabla)
- Eventos de Dominio (tabla)
- Use Cases (tabla)
- Ports (tabla)
- Implementaciones por entorno (tabla por port)

Para modulo read-only:
- Responsabilidad
- Objetos de Dominio (tabla con tipo)
- Use Cases (tabla + pipeline ASCII si hay flujo complejo)
- Ports (tabla)
- Implementaciones por entorno (tabla por port)

---

## 5. Nivel Aplicacion (`application/{name}/CLAUDE.md`)

### 5.1 Template

```markdown
# {Nombre Aplicacion} — Application Layer

## Rol

**No es un bounded context** — es la capa de orquestacion que coordina los N bounded
contexts via sus services. Expone un API unificado (`{AppName}Port`) para consumidores
externos (UI, REST, CLI).

## Port: `{AppName}Port`

{Descripcion del port: punto de entrada unico, primary port hexagonal.}

### Operaciones

| Operacion | Descripcion | Contextos coordinados |
|-----------|-------------|----------------------|
| `execute` | Pipeline completo | Ctx1, Ctx2, Ctx3 |
| `operacion1` | Descripcion | Ctx1 |
| `operacion2` | Descripcion | Ctx2, Ctx3 |

{Nota sobre patron de retorno: Result<Error, Success>.}

## Orchestrator: `{AppName}Orchestrator`

Implementa `{AppName}Port`. Recibe los N services + repositorios auxiliares como
dependencias privadas.

**Reglas de diseno**:
- Sin getters de services — son detalles de implementacion privados
- Sin lectura de policies — la factory resuelve infraestructura
- Sin logica de dominio — solo delegacion a use cases
- Sin dependencias de framework — TypeScript puro

### Use Cases internos

| Use Case | Services usados |
|----------|----------------|
| `ExecuteFullPipeline` | Service1, Service2, ... |
| `SpecificOperation` | ServiceN |

## Domain Objects

### `{DomainObject}` (si aplica)

{Descripcion del objeto. Aclarar si NO es un DDD aggregate
(ej: tracker, manifest, DTO).}

| Campo | Descripcion |
|-------|-------------|
| `campo1` | Descripcion |
| `campo2` | Descripcion |

### `{ErrorType}`

{Descripcion del error de la application layer.}

- `step` — donde ocurrio
- `code` — codigo programatico
- `completedSteps` — pasos completados antes del fallo

## Contracts (DTOs)

{Breve descripcion de los contratos de datos: puros, sin logica, JSON-safe.}

## Port de Persistencia (si aplica)

`{Repository}` — operaciones

### Implementaciones

| Implementacion | Entorno |
|---------------|---------|
| `InMemory{Repo}` | Testing/desarrollo |
| `NeDB{Repo}` | Server |

## Composicion

{Diagrama ASCII de la factory: que services compone, wiring cross-context.}

## Flujo End-to-End (`{operacion_principal}`)

{Diagrama ASCII del flujo completo paso a paso.}
```

### 5.2 Secciones Obligatorias

- Rol (aclarar que NO es bounded context)
- Port con tabla de operaciones
- Orchestrator con reglas de diseno
- Use Cases internos (tabla)
- Composicion (ASCII)
- Flujo End-to-End (ASCII)

### 5.3 Que NO incluir en Nivel Aplicacion

- Detalles internos de los bounded contexts
- Implementacion de los use cases (logica)
- Patrones de codigo (eso va en skills de DDD)

---

## 6. Cross-References

### 6.1 Patron de Links entre Niveles

Los links siguen una convencion descendente: cada nivel apunta al siguiente para detalle.

| Desde | Hacia | Formato |
|-------|-------|---------|
| Producto → Contexto | `**Ver**: contexts/{name}/CLAUDE.md` | En la seccion del contexto |
| Producto → Aplicacion | `[Ver detalle](ruta/relativa/CLAUDE.md)` | Link inline en heading |
| Contexto → Modulo | `[Ver detalle]({modulo}/CLAUDE.md)` | Link inline en heading de modulo |

### 6.2 Convenciones de Paths

- Los links son **relativos** al archivo que los contiene
- Producto esta en `.claude/CLAUDE.md`, asi que usa `../contexts/...` o `../application/...`
- Contexto esta en `contexts/{name}/CLAUDE.md`, asi que usa `{modulo}/CLAUDE.md`
- Nunca usar paths absolutos

### 6.3 Ejemplos

Desde Producto:
```markdown
### Knowledge Pipeline Orchestrator (`application/knowledge-pipeline/`) — [Ver detalle](../application/knowledge-pipeline/CLAUDE.md)
```

Desde Contexto:
```markdown
### 1. Source (`source/`) — [Ver detalle](source/CLAUDE.md)
```

---

## 7. Reglas Anti-Errores

### 7.1 Duplicacion de Informacion

```
❌ INCORRECTO                                   ✅ CORRECTO
──────────────────────────────────────────────────────────────────
Producto lista todos los value objects           Producto lista modulos, contexto
de cada modulo                                   lista VOs como nombres, modulo
                                                 detalla cada VO en tabla

Contexto copia tabla de propiedades              Contexto resume aggregate en 1
del aggregate del modulo                         linea, link "Ver detalle"

Contexto lista implementaciones con              Contexto lista nombres de impls,
tabla de entornos                                modulo tiene tabla con entorno
```

### 7.2 Nivel Incorrecto de Detalle

```
❌ INCORRECTO                                   ✅ CORRECTO
──────────────────────────────────────────────────────────────────
Producto describe pipeline interno de            Producto describe flujo E2E entre
un use case                                      contextos

Producto incluye tabla de operaciones            Producto describe service en 1 linea,
del service con columnas detalladas              contexto tiene la tabla completa

Contexto describe ciclo de vida completo         Contexto menciona ciclo de vida
del aggregate con maquina de estados             en 1 linea, modulo lo detalla
```

### 7.3 Contenido Prohibido

```
❌ NUNCA incluir en CLAUDE.md
──────────────────────────────────────────────────────────────────
Code snippets de implementacion (TypeScript, etc.)
  Excepcion: diagramas ASCII de flujo, composicion o arbol de carpetas

Instrucciones de como implementar (patrones de codigo)
  Para eso existen los skills de DDD

Comentarios TODO o WIP
  CLAUDE.md documenta el estado actual, no el estado futuro

Configuracion de herramientas (tsconfig, eslint, etc.)
  Eso va en README o docs/

Metricas, benchmarks o datos de rendimiento
  Eso va en docs/ o ADRs
```

### 7.4 Service sin Tabla de Operaciones

```
❌ INCORRECTO                                   ✅ CORRECTO
──────────────────────────────────────────────────────────────────
## Service: `MyService`                         ## Service: `MyService`

Expone operaciones del contexto.                Punto de entrada unico.

                                                ### Capacidades expuestas

                                                | Operacion | Descripcion | Modulos |
                                                |-----------|-------------|---------|
                                                | `op1`     | Que hace    | mod-a   |
```

### 7.5 Modulo sin Implementaciones por Entorno

```
❌ INCORRECTO                                   ✅ CORRECTO
──────────────────────────────────────────────────────────────────
## Port                                         ## Port

`SourceRepository`                              `SourceRepository` — save, findById,
                                                delete, findByType, exists

                                                ## Implementaciones de Persistencia

                                                | Implementacion | Entorno |
                                                |---------------|---------|
                                                | `InMemory...` | Testing |
                                                | `IndexedDB..` | Browser |
                                                | `NeDB...`     | Server  |
```

---

## 8. Convenciones

### 8.1 Formato por Tipo de Contenido

| Tipo de contenido | Formato | Donde se usa |
|-------------------|---------|-------------|
| Operaciones/capacidades | Tabla con columnas | Service (contexto), Port (aplicacion) |
| Value Objects | Tabla: nombre + descripcion | Modulo |
| Eventos de Dominio | Tabla: evento + significado | Modulo, catalogo en Producto |
| Use Cases | Tabla: nombre + descripcion | Modulo, Aplicacion |
| Ports | Tabla: nombre + responsabilidad | Modulo |
| Implementaciones | Tabla: nombre + entorno | Modulo |
| Ciclos de vida | Inline con flechas (`→`) | Modulo (aggregate) |
| Flujos de datos | Diagrama ASCII vertical | Producto (E2E), Aplicacion (E2E) |
| Composicion | Diagrama ASCII tipo arbol | Contexto, Aplicacion |
| Estructura de carpetas | Diagrama ASCII tipo arbol | Producto (arquitectura general) |

### 8.2 Idioma

Seguir el idioma del proyecto. Si el codigo y los nombres de dominio estan en ingles pero la documentacion en espanol, mantener:
- **Nombres tecnicos** en ingles (clases, metodos, campos)
- **Descripciones** en el idioma del proyecto
- **Headings** en el idioma del proyecto

### 8.3 Formato de Headings por Nivel

| Nivel | H1 | H2 | H3 |
|-------|----|----|-----|
| Producto | `# {Proyecto} — Product Capabilities` | Secciones principales | Cada contexto/aplicacion |
| Contexto | `# {Nombre} — Bounded Context` | Secciones principales | Cada modulo |
| Modulo | `# {Nombre} — Module` | Secciones principales | Sub-secciones |
| Aplicacion | `# {Nombre} — Application Layer` | Secciones principales | Sub-secciones |

### 8.4 Separadores

- Usar `---` (horizontal rule) para separar secciones principales dentro del Contexto (antes de cada modulo)
- No usar separadores dentro de modulos individuales o aplicacion (usar headings)

---

## 9. Checklists

### 9.1 Nuevo CLAUDE.md de Producto

- [ ] H1 con formato `{Proyecto} — Product Capabilities`
- [ ] Vision en 2-3 lineas
- [ ] Arquitectura General con diagrama ASCII de carpetas
- [ ] Cada bounded context con: subdominio, responsabilidad, modulos, service, link
- [ ] Application Layer con operaciones listadas
- [ ] Platform con listado de infraestructura compartida
- [ ] Shared Kernel con building blocks
- [ ] Flujo de Datos End-to-End con diagrama ASCII
- [ ] Catalogo de Eventos de Dominio completo (tabla)
- [ ] Sin detalles de implementacion ni code snippets

### 9.2 Nuevo CLAUDE.md de Contexto

- [ ] H1 con formato `{Nombre} — Bounded Context`
- [ ] Subdominio en 2-3 lineas
- [ ] Service con nombre de clase
- [ ] Tabla de operaciones completa (operacion, descripcion, modulos)
- [ ] Diagrama ASCII de composicion (composition/ a nivel raiz del contexto)
- [ ] Cross-context wiring documentado (si aplica)
- [ ] Cada modulo con: responsabilidad, aggregate, VOs, eventos, use cases, ports, implementaciones
- [ ] Links "Ver detalle" a cada modulo CLAUDE.md
- [ ] Separadores `---` entre modulos

### 9.3 Nuevo CLAUDE.md de Modulo (Standard)

- [ ] H1 con formato `{Nombre} — Module`
- [ ] Responsabilidad en 2-3 lineas
- [ ] Aggregate Root con propiedades y ciclo de vida
- [ ] Tabla de Value Objects
- [ ] Tabla de Eventos de Dominio
- [ ] Tabla de Use Cases (+ pipeline ASCII si hay flujo complejo)
- [ ] Tabla de Ports con responsabilidad
- [ ] Tabla de Implementaciones por entorno (para cada port)
- [ ] Nota de diseno (si hay decisiones no obvias)

### 9.4 Nuevo CLAUDE.md de Modulo (Read-Only)

- [ ] H1 con formato `{Nombre} — Module`
- [ ] Responsabilidad (mencionar que es read-only)
- [ ] Tabla de Objetos de Dominio con tipo (transientes)
- [ ] Tabla de Use Cases (+ pipeline ASCII)
- [ ] Tabla de Ports con responsabilidad
- [ ] Tabla de Implementaciones por entorno por port
- [ ] Requisito critico / nota especial (si aplica)

### 9.5 Nuevo CLAUDE.md de Aplicacion

- [ ] H1 con formato `{Nombre} — Application Layer`
- [ ] Rol aclarando que NO es bounded context
- [ ] Port con tabla de operaciones (operacion, descripcion, contextos coordinados)
- [ ] Orchestrator con reglas de diseno
- [ ] Tabla de Use Cases internos (use case, services usados)
- [ ] Domain Objects documentados (si aplica)
- [ ] Error type documentado con campos
- [ ] Contracts/DTOs mencionados
- [ ] Port de persistencia con implementaciones (si aplica)
- [ ] Diagrama ASCII de composicion
- [ ] Diagrama ASCII de flujo End-to-End

### 9.6 Checklist de Actualizacion

Cuando actualizar los CLAUDE.md:

- [ ] **Nuevo modulo creado** → Actualizar CLAUDE.md del contexto (agregar seccion) + crear CLAUDE.md del modulo
- [ ] **Nuevo contexto creado** → Actualizar CLAUDE.md de producto (agregar seccion) + crear CLAUDE.md del contexto + crear CLAUDE.md de cada modulo
- [ ] **Nueva operacion en service** → Actualizar tabla de operaciones en CLAUDE.md del contexto
- [ ] **Nuevo evento de dominio** → Actualizar tabla en CLAUDE.md del modulo + catalogo en CLAUDE.md de producto
- [ ] **Nuevo use case** → Actualizar tabla en CLAUDE.md del modulo
- [ ] **Nuevo port o implementacion** → Actualizar tablas en CLAUDE.md del modulo
- [ ] **Nuevo value object** → Actualizar tabla en CLAUDE.md del modulo + resumen en contexto
- [ ] **Cambio en application layer** → Actualizar CLAUDE.md de aplicacion (operaciones, use cases, flujo)
- [ ] **Cross-context wiring cambia** → Actualizar seccion en contexto + composicion en aplicacion

---

*Skill de agent knowledge architecture para proyectos DDD/monolito modular — Ultima actualizacion: Febrero 2026*
