# Modular Monolith Patterns

## Descripción

Patrones arquitectónicos para construir monolitos modulares con boundaries claros, comunicación entre módulos bien definida, y preparación para eventual extracción a servicios. Aplicable a TypeScript/Node.js con DDD.

---

## 0. Principio Fundamental

> Un monolito modular es **una unidad de despliegue** organizada en **módulos de dominio**: slices cohesivos que encapsulan capacidades, políticas y los datos que poseen autoritativamente. Los módulos ocultan sus internos y exponen contratos — APIs y/o eventos — escritos en lenguaje ubicuo.

### 0.1 ¿Por qué Modular Monolith?

| Aspecto | Monolito tradicional | Modular Monolith | Microservicios |
|---------|---------------------|-------------------|----------------|
| Despliegue | 1 unidad, acoplada | 1 unidad, desacoplada | N unidades |
| Comunicación | Llamadas directas caóticas | Contratos entre módulos | Red (HTTP/gRPC/mensajes) |
| Consistencia | Fácil (1 DB) | Controlada (1 DB, schemas separados) | Eventual |
| Complejidad operacional | Baja | Baja | Alta |
| Evolucionabilidad | Baja | Alta | Alta |
| Extracción a servicio | Difícil | Diseñada para ello | Ya está |

---

## 1. Anatomía de un Módulo

### 1.1 Estructura

```
{module}/
├── public/                    # Contrato público del módulo
│   ├── {Module}Facade.ts      # API pública (único punto de entrada)
│   ├── {Module}Events.ts      # Eventos que el módulo emite
│   └── types.ts               # DTOs públicos (nunca entidades internas)
│
├── domain/                    # Internos del dominio (NO exportados)
│   ├── {Aggregate}.ts
│   ├── {ValueObject}.ts
│   └── {Aggregate}Repository.ts
│
├── application/               # Use Cases (NO exportados directamente)
│   └── {UseCase}.ts
│
├── infrastructure/            # Adapters (NO exportados)
│   └── persistence/
│
└── composition/               # Wiring interno
    └── {Module}Composer.ts
```

### 1.2 Regla de Encapsulación

```
✅ CORRECTO                              ❌ INCORRECTO
───────────────────────────────────────────────────────────────
Módulo expone Facade como API pública     Módulo expone Repository
Módulo expone DTOs inmutables             Módulo expone Entidades de dominio
Módulo expone Eventos tipados             Módulo expone Use Cases directamente
Consumers usan solo el contrato público   Consumers importan internos del módulo
```

---

## 2. Boundaries: Tipos de Límites

### 2.1 Code Boundary (Límite de Código)

Cada módulo exporta **solo** su contrato público. Los internos son inaccesibles.

```typescript
// module/index.ts — SOLO exports públicos
export { OrderFacade } from "./public/OrderFacade";
export type { OrderDTO, CreateOrderRequest } from "./public/types";
export { OrderCreatedEvent, OrderPaidEvent } from "./public/OrderEvents";

// NUNCA exportar:
// export { Order } from "./domain/Order";           ❌
// export { OrderRepository } from "./domain/...";   ❌
```

**Enforcement:**
- ESLint rules que prohíban imports entre módulos excepto desde `public/`
- Tests arquitectónicos que validen la dependency matrix
- Path aliases que solo resuelvan al `index.ts` público

### 2.2 Data Boundary (Límite de Datos)

Cada módulo es **dueño exclusivo** de sus datos. Ningún otro módulo lee ni escribe directamente.

```
✅ Un writer por dataset
✅ Módulo A pide datos a Módulo B via Facade
✅ Módulo A subscribe a eventos de Módulo B

❌ Módulo A hace query directo a la tabla de Módulo B
❌ Módulo A y B comparten la misma tabla
❌ Módulo A escribe en la tabla de Módulo B
```

**Estrategias de separación de datos:**

| Estrategia | Descripción | Cuándo usar |
|------------|-------------|-------------|
| Schema-per-module | Cada módulo tiene su schema en la misma DB | Inicio, simplicidad |
| Table prefix | Tablas prefijadas con nombre del módulo | Cuando no hay schemas |
| Separate DB | Cada módulo tiene su propia base de datos | Pre-extracción a servicio |

### 2.3 Team Boundary (Límite de Equipo)

Cada módulo puede ser desarrollado independientemente por un equipo diferente. El contrato público es el acuerdo entre equipos.

---

## 3. Comunicación entre Módulos

### 3.1 Síncrona: Method Calls via Facade

La forma más simple. Módulo A llama un método del Facade de Módulo B y espera resultado.

```typescript
// OrderModule llama a InventoryModule
class OrderFacade {
  constructor(
    private readonly inventory: InventoryFacade, // Inyectado
  ) {}

  async createOrder(cmd: CreateOrderCommand): Promise<Result<OrderError, OrderDTO>> {
    // 1. Verificar stock via contrato público de Inventory
    const stockCheck = await this.inventory.checkAvailability(cmd.items);
    if (stockCheck.isFail()) {
      return Result.fail(new InsufficientStockError(stockCheck.error));
    }

    // 2. Crear orden internamente
    const order = Order.create(cmd);
    await this.repository.save(order);

    // 3. Reservar stock
    const reservation = await this.inventory.reserveItems(order.id, cmd.items);
    if (reservation.isFail()) {
      // Compensar: cancelar orden
      await this.cancelOrder(order.id);
      return Result.fail(new ReservationFailedError());
    }

    return Result.ok(order.toDTO());
  }
}
```

**Cuándo usar:**
- El caller necesita respuesta inmediata
- La consistencia transaccional es importante
- El acoplamiento temporal es aceptable

### 3.2 Asíncrona: Eventos entre Módulos

Comunicación desacoplada via eventos. El emisor no sabe quién consume.

```typescript
// ── Módulo Emisor ─────────────────────────────
class OrderFacade {
  async completeOrder(orderId: string): Promise<Result<OrderError, void>> {
    const order = await this.repository.findById(orderId);
    order.complete();
    await this.repository.save(order);

    // Publicar evento — NO sabe quién escucha
    await this.eventPublisher.publish(new OrderCompletedEvent({
      orderId: order.id,
      customerId: order.customerId,
      totalAmount: order.total,
      items: order.items.map(i => i.toDTO()),
    }));

    return Result.ok();
  }
}

// ── Módulo Consumidor ─────────────────────────
// En el módulo de Shipping
class ShippingEventHandler {
  constructor(private readonly shippingFacade: ShippingFacade) {}

  @OnEvent("order.completed")
  async handleOrderCompleted(event: OrderCompletedEvent): Promise<void> {
    await this.shippingFacade.scheduleShipment({
      orderId: event.orderId,
      items: event.items,
    });
  }
}
```

**Cuándo usar:**
- No se necesita respuesta inmediata
- Se quiere desacoplar módulos al máximo
- Procesamiento background o side-effects
- Preparación para futura extracción a servicio

### 3.3 Tabla de Decisión

| Escenario | Síncrono | Asíncrono |
|-----------|----------|-----------|
| Necesito respuesta para continuar | ✅ | ❌ |
| Es un side-effect (notificación, log, analytics) | ❌ | ✅ |
| La operación puede fallar y necesito compensar | ✅ | ⚠️ (saga) |
| Quiero máximo desacoplamiento | ❌ | ✅ |
| Pre-extracción a microservicio | ⚠️ (refactor después) | ✅ (ya preparado) |

---

## 4. Anti-Corruption Layer (ACL)

### 4.1 Definición

El ACL protege el modelo de dominio de un módulo contra conceptos de otro módulo o sistema externo. Traduce entre lenguajes ubícuos distintos.

### 4.2 Patrón: Gateway + Facade

```typescript
// ── Módulo Payments ───────────────────────────
// Tiene su propio concepto de "Charge" (no "Order")

// Gateway en el lado del caller (OrderModule)
class PaymentGateway {
  constructor(private readonly paymentFacade: PaymentFacade) {}

  // Traduce de Order language → Payment language
  async chargeForOrder(order: Order): Promise<Result<PaymentError, ChargeReference>> {
    return this.paymentFacade.createCharge({
      referenceId: order.id,          // Order → referenceId
      amount: order.total.value,       // Money → number
      currency: order.total.currency,
      description: `Order #${order.id}`,
      metadata: {
        customerId: order.customerId,
        itemCount: order.items.length,
      },
    });
  }
}

// Facade en el lado del callee (PaymentModule)
class PaymentFacade {
  // Habla en SU lenguaje (Charge, no Order)
  async createCharge(request: CreateChargeRequest): Promise<Result<PaymentError, ChargeReference>> {
    // ...
  }
}
```

### 4.3 Cuándo aplicar ACL

```
✅ NECESARIO                             ❌ NO NECESARIO
───────────────────────────────────────────────────────────────
Módulos con lenguajes ubícuos distintos   Módulos del mismo bounded context
Integración con sistema externo           Módulos que comparten el mismo idioma
Traducción de conceptos de dominio        Llamadas simples sin traducción
```

---

## 5. Composition Root

### 5.1 Definición

El Composition Root es el **único lugar** donde se ensamblan todos los módulos y se resuelven sus dependencias. Vive fuera de los módulos.

```typescript
// composition-root.ts — FUERA de cualquier módulo
export class CompositionRoot {
  static async compose(policy: AppPolicy): Promise<Application> {
    // 1. Resolver módulos independientes (paralelo)
    const [orderModule, inventoryModule, paymentModule] = await Promise.all([
      OrderComposer.resolve(policy),
      InventoryComposer.resolve(policy),
      PaymentComposer.resolve(policy),
    ]);

    // 2. Wiring entre módulos via contratos públicos
    const orderFacade = new OrderFacade({
      inventory: inventoryModule.facade,    // Solo contrato público
      payment: paymentModule.facade,        // Solo contrato público
      ...orderModule,
    });

    // 3. Registrar event handlers cross-module
    const eventBus = new InMemoryEventBus();
    eventBus.subscribe("order.completed", new ShippingEventHandler(shippingModule.facade));
    eventBus.subscribe("order.completed", new NotificationHandler(notificationModule.facade));

    return new Application({ orderFacade, inventoryModule, paymentModule, eventBus });
  }
}
```

### 5.2 Reglas del Composition Root

```
✅ CORRECTO                              ❌ INCORRECTO
───────────────────────────────────────────────────────────────
Composition Root ensambla módulos         Módulo se auto-ensambla
Composition Root decide implementaciones  Módulo importa otro módulo directamente
Composition Root wires event handlers     Event handlers hardcodeados en módulos
Composition Root está en la raíz          Composition Root dentro de un módulo
```

---

## 6. Outbox Pattern (Preparación para Extracción)

### 6.1 Problema

Cuando un módulo persiste datos Y publica eventos, ambas operaciones deben ser atómicas. Si la persistencia funciona pero el evento no se publica, el sistema queda inconsistente.

### 6.2 Solución: Transactional Outbox

```typescript
class OrderRepository {
  async saveWithEvents(order: Order, events: DomainEvent[]): Promise<void> {
    // Transacción atómica: guardar entidad + eventos en outbox
    await this.db.transaction(async (tx) => {
      await tx.save("orders", order.toPersistence());
      for (const event of events) {
        await tx.save("outbox", {
          id: generateId(),
          eventType: event.eventType,
          payload: JSON.stringify(event),
          createdAt: new Date(),
          published: false,
        });
      }
    });
  }
}

// Background processor publica eventos pendientes
class OutboxProcessor {
  async processUnpublished(): Promise<void> {
    const pending = await this.outboxRepo.findUnpublished();
    for (const entry of pending) {
      await this.eventPublisher.publish(JSON.parse(entry.payload));
      await this.outboxRepo.markPublished(entry.id);
    }
  }
}
```

### 6.3 Valor para Extracción

Cuando extraes un módulo a un servicio independiente:
- La comunicación síncrona (Facade) se reemplaza por HTTP/gRPC
- La comunicación asíncrona (eventos) se reemplaza por message broker (RabbitMQ/Kafka)
- El Outbox garantiza que no se pierden eventos en la transición

---

## 7. Module Client Pattern (Abstracción para Extracción)

### 7.1 Interface en Shared

```typescript
// shared/clients/UserClient.ts
export interface UserClient {
  getById(id: string): Promise<UserDTO | null>;
  exists(id: string): Promise<boolean>;
}
```

### 7.2 Implementación In-Process (Monolito)

```typescript
// user-module/infrastructure/InProcessUserClient.ts
export class InProcessUserClient implements UserClient {
  constructor(private readonly userFacade: UserFacade) {}

  async getById(id: string): Promise<UserDTO | null> {
    return this.userFacade.findById(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.userFacade.exists(id);
  }
}
```

### 7.3 Implementación HTTP (Post-extracción)

```typescript
// user-module/infrastructure/HttpUserClient.ts
export class HttpUserClient implements UserClient {
  constructor(private readonly baseUrl: string) {}

  async getById(id: string): Promise<UserDTO | null> {
    const response = await fetch(`${this.baseUrl}/users/${id}`);
    if (response.status === 404) return null;
    return response.json();
  }

  async exists(id: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/users/${id}/exists`);
    return response.json();
  }
}
```

El Composition Root decide cuál implementación usar. **El módulo consumidor no cambia.**

---

## 8. Enforcement: Tests Arquitectónicos

### 8.1 Dependency Matrix

```typescript
// architecture.test.ts
describe("Module Boundaries", () => {
  it("OrderModule should only import from public contracts of other modules", () => {
    const orderImports = analyzeImports("src/modules/order");
    const forbidden = orderImports.filter(imp =>
      imp.includes("/modules/") &&
      !imp.includes("/public/") &&
      !imp.includes("/modules/order/") // own module OK
    );
    expect(forbidden).toEqual([]);
  });

  it("No module should have circular dependencies", () => {
    const graph = buildDependencyGraph("src/modules");
    const cycles = detectCycles(graph);
    expect(cycles).toEqual([]);
  });

  it("Each module should export only from public/", () => {
    const moduleIndexes = glob("src/modules/*/index.ts");
    for (const index of moduleIndexes) {
      const exports = analyzeExports(index);
      const leaks = exports.filter(exp => !exp.includes("/public/"));
      expect(leaks).toEqual([]);
    }
  });
});
```

### 8.2 ESLint Boundaries

```json
{
  "rules": {
    "import/no-restricted-paths": ["error", {
      "zones": [{
        "target": "./src/modules/order",
        "from": "./src/modules/inventory/domain",
        "message": "Use InventoryFacade instead of importing domain internals"
      }]
    }]
  }
}
```

---

## 9. Checklist: Nuevo Módulo en Monolito Modular

- [ ] ¿El módulo tiene un `public/` con Facade, Events y DTOs?
- [ ] ¿El `index.ts` solo exporta desde `public/`?
- [ ] ¿El módulo NO importa internos de otros módulos?
- [ ] ¿La comunicación síncrona usa Facades?
- [ ] ¿La comunicación asíncrona usa Eventos tipados?
- [ ] ¿Existe ACL donde se traduce entre lenguajes ubícuos?
- [ ] ¿El Composition Root es el único que wires módulos?
- [ ] ¿Cada módulo es dueño exclusivo de sus datos?
- [ ] ¿Tests arquitectónicos validan boundaries?
- [ ] ¿El módulo podría extraerse sin cambiar consumidores?

---

## 10. Anti-Patrones

| Anti-patrón | Problema | Solución |
|-------------|----------|----------|
| **Shared database tables** | Acoplamiento de datos, no se puede extraer módulo | Schema-per-module o table prefix |
| **God module** | Un módulo que sabe de todo | Dividir por bounded context |
| **Cross-module domain imports** | Acoplamiento a implementación interna | Solo importar contrato público |
| **Event chains** | A→B→C→D, imposible de debuggear | Limitar profundidad, usar sagas para flujos complejos |
| **Distributed monolith** | Módulos separados pero totalmente acoplados | Verificar que cada módulo puede operar independientemente |
| **Shared mutable state** | Singleton o global state compartido | Cada módulo tiene su estado propio |

---

*Skill de patrones Modular Monolith — Complementa ddd-context-design (klay+-specific) con patrones genéricos transferibles*
