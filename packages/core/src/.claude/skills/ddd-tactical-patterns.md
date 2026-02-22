# DDD Tactical Patterns

## Descripcion

Patrones tacticos genericos de Domain-Driven Design: Aggregates, Entities, Value Objects, Domain Events, Specifications, Repositories y Domain Services. Aplicable a cualquier proyecto TypeScript/Node.js, independiente de klay+.

---

## 0. Mapa de Building Blocks

```
                    ┌─────────────────────────────────────────┐
                    │           Application Layer             │
                    │  Use Cases / Application Services       │
                    │  (orquesta, NO contiene reglas)         │
                    └────────────────┬────────────────────────┘
                                     │ usa
                    ┌────────────────▼────────────────────────┐
                    │            Domain Layer                  │
                    │                                         │
                    │  ┌─────────────────────────────────┐    │
                    │  │       Aggregate Root             │    │
                    │  │  ┌─────────┐  ┌──────────────┐  │    │
                    │  │  │ Entity  │  │ Value Object │  │    │
                    │  │  └─────────┘  └──────────────┘  │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │     Domain Events         │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  └─────────────────────────────────┘    │
                    │                                         │
                    │  ┌──────────────┐  ┌────────────────┐   │
                    │  │ Domain       │  │ Specification  │   │
                    │  │ Service      │  │ Pattern        │   │
                    │  └──────────────┘  └────────────────┘   │
                    │                                         │
                    │  ┌──────────────────────────────────┐   │
                    │  │ Repository Interface (Port)       │   │
                    │  └──────────────────────────────────┘   │
                    └─────────────────────────────────────────┘
```

---

## 1. Value Objects

### 1.1 Definicion

Un Value Object es un objeto **inmutable** que se define por sus atributos, no por una identidad. Dos Value Objects con los mismos atributos son iguales.

### 1.2 Reglas

1. **Inmutables** — una vez creados, no cambian
2. **Sin identidad** — la igualdad es por valor, no por referencia
3. **Auto-validados** — la creacion falla si los datos son invalidos
4. **Reemplazables** — para "modificar", se crea uno nuevo

### 1.3 Patron Base

```typescript
export abstract class ValueObject<T> {
  protected readonly _value: T;

  protected constructor(value: T) {
    this._value = Object.freeze(value) as T;
  }

  get value(): T {
    return this._value;
  }

  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) return false;
    return JSON.stringify(this._value) === JSON.stringify(other._value);
  }
}
```

### 1.4 Ejemplos Comunes

```typescript
// ── Value Object Simple (wrapper) ─────────────────
export class Email extends ValueObject<string> {
  private static readonly PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(value: string) {
    super(value);
  }

  static create(value: string): Result<ValidationError, Email> {
    if (!value || !Email.PATTERN.test(value)) {
      return Result.fail(new ValidationError("Email", "format", `Invalid email: ${value}`));
    }
    return Result.ok(new Email(value.toLowerCase().trim()));
  }
}

// ── Value Object Compuesto ────────────────────────
export class Money extends ValueObject<{ amount: number; currency: string }> {
  private constructor(amount: number, currency: string) {
    super({ amount, currency });
  }

  get amount(): number { return this._value.amount; }
  get currency(): string { return this._value.currency; }

  static create(amount: number, currency: string): Result<ValidationError, Money> {
    if (amount < 0) return Result.fail(new ValidationError("Money", "amount", "Cannot be negative"));
    if (!currency || currency.length !== 3) return Result.fail(new ValidationError("Money", "currency", "Must be ISO 4217"));
    return Result.ok(new Money(amount, currency));
  }

  add(other: Money): Result<DomainError, Money> {
    if (this.currency !== other.currency) {
      return Result.fail(new CurrencyMismatchError(this.currency, other.currency));
    }
    return Money.create(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Result<DomainError, Money> {
    if (this.currency !== other.currency) {
      return Result.fail(new CurrencyMismatchError(this.currency, other.currency));
    }
    return Money.create(this.amount - other.amount, this.currency);
  }
}

// ── Value Object como ID ──────────────────────────
export class OrderId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): OrderId {
    return new OrderId(value ?? generateUUID());
  }

  toString(): string { return this._value; }
}
```

### 1.5 Cuando usar Value Objects

| Usar Value Object | Usar primitivo |
|-------------------|---------------|
| Email, Phone, URL (validacion rica) | Flags booleanos simples |
| Money, Percentage (operaciones de dominio) | Contadores internos triviales |
| Address, Coordinates (composicion) | IDs de infra sin logica |
| DateRange, TimeSlot (invariantes) | Timestamps crudos |

---

## 2. Entities

### 2.1 Definicion

Una Entity tiene **identidad** que la distingue a lo largo de su ciclo de vida, incluso si sus atributos cambian.

### 2.2 Reglas

1. **Identidad unica** — definida por un ID, no por atributos
2. **Mutable** — su estado puede cambiar
3. **Ciclo de vida** — tiene creacion, modificacion y posible eliminacion
4. **Encapsulada** — los cambios de estado ocurren mediante metodos con nombre de negocio

### 2.3 Patron Base

```typescript
export abstract class Entity<TId> {
  protected readonly _id: TId;

  protected constructor(id: TId) {
    this._id = id;
  }

  get id(): TId { return this._id; }

  equals(other: Entity<TId>): boolean {
    if (other === null || other === undefined) return false;
    return this._id === other._id;
  }
}
```

### 2.4 Ejemplo

```typescript
export class LineItem extends Entity<LineItemId> {
  private _productId: ProductId;
  private _quantity: Quantity;
  private _unitPrice: Money;

  private constructor(id: LineItemId, productId: ProductId, quantity: Quantity, unitPrice: Money) {
    super(id);
    this._productId = productId;
    this._quantity = quantity;
    this._unitPrice = unitPrice;
  }

  get productId(): ProductId { return this._productId; }
  get quantity(): Quantity { return this._quantity; }
  get unitPrice(): Money { return this._unitPrice; }
  get subtotal(): Money { return this._unitPrice.multiply(this._quantity.value); }

  // Metodo de negocio, no setter generico
  adjustQuantity(newQuantity: Quantity): Result<DomainError, void> {
    if (newQuantity.value <= 0) {
      return Result.fail(new InvalidQuantityError(newQuantity.value));
    }
    this._quantity = newQuantity;
    return Result.ok();
  }

  static create(productId: ProductId, quantity: Quantity, unitPrice: Money): LineItem {
    return new LineItem(LineItemId.create(), productId, quantity, unitPrice);
  }

  static reconstitute(id: LineItemId, productId: ProductId, quantity: Quantity, unitPrice: Money): LineItem {
    return new LineItem(id, productId, quantity, unitPrice);
  }
}
```

---

## 3. Aggregate Root

### 3.1 Definicion

Un Aggregate es un **cluster de objetos de dominio** (Entities + Value Objects) tratados como una unidad para propositos de cambios de datos. El Aggregate Root es la **unica entrada** al cluster.

### 3.2 Reglas Fundamentales

1. **Un Aggregate Root por transaccion** — nunca modificar multiples Aggregates en la misma transaccion
2. **Referencia por ID** — los Aggregates se referencian entre si solo por ID, nunca por referencia directa
3. **Consistency boundary** — las invariantes dentro del Aggregate son consistentes inmediatamente
4. **Constructor privado** — solo factorials create() y reconstitute()
5. **Eventos en create/mutate** — nunca en reconstitute

### 3.3 Patron Completo

```typescript
export class Order extends AggregateRoot<OrderId> {
  private _customerId: CustomerId;
  private _items: LineItem[];
  private _status: OrderStatus;
  private _totalAmount: Money;

  private constructor(
    id: OrderId,
    customerId: CustomerId,
    items: LineItem[],
    status: OrderStatus,
    totalAmount: Money,
  ) {
    super(id);
    this._customerId = customerId;
    this._items = items;
    this._status = status;
    this._totalAmount = totalAmount;
  }

  // ── Getters (solo lectura) ──────────────────────
  get customerId(): CustomerId { return this._customerId; }
  get items(): readonly LineItem[] { return this._items; }
  get status(): OrderStatus { return this._status; }
  get totalAmount(): Money { return this._totalAmount; }

  // ── Factory: crear nuevo (con validacion + evento) ──
  static create(customerId: CustomerId): Order {
    const order = new Order(
      OrderId.create(),
      customerId,
      [],
      OrderStatus.DRAFT,
      Money.zero("USD"),
    );
    order.record(new OrderCreatedEvent({
      orderId: order.id.toString(),
      customerId: customerId.toString(),
    }));
    return order;
  }

  // ── Reconstitute: hidratar desde persistencia (sin validacion, sin eventos) ──
  static reconstitute(
    id: OrderId,
    customerId: CustomerId,
    items: LineItem[],
    status: OrderStatus,
    totalAmount: Money,
  ): Order {
    return new Order(id, customerId, items, status, totalAmount);
  }

  // ── Comportamiento de dominio ───────────────────
  addItem(item: LineItem): Result<DomainError, void> {
    if (this._status !== OrderStatus.DRAFT) {
      return Result.fail(new OrderNotEditableError(this.id.toString()));
    }

    // Invariante: no duplicar producto
    const existing = this._items.find(i => i.productId.equals(item.productId));
    if (existing) {
      return Result.fail(new DuplicateItemError(item.productId.toString()));
    }

    this._items.push(item);
    this._totalAmount = this.recalculateTotal();
    return Result.ok();
  }

  submit(): Result<DomainError, void> {
    if (this._items.length === 0) {
      return Result.fail(new EmptyOrderError());
    }
    if (this._status !== OrderStatus.DRAFT) {
      return Result.fail(new InvalidTransitionError(this._status, OrderStatus.SUBMITTED));
    }

    this._status = OrderStatus.SUBMITTED;
    this.record(new OrderSubmittedEvent({
      orderId: this.id.toString(),
      totalAmount: this._totalAmount.amount,
    }));
    return Result.ok();
  }

  // ── Metodo privado: invariante interna ──────────
  private recalculateTotal(): Money {
    return this._items.reduce(
      (acc, item) => acc.add(item.subtotal).value,
      Money.zero("USD"),
    );
  }
}
```

### 3.4 Diseno de Aggregates: Guia de Tamano

| Senial | Aggregate demasiado grande | Aggregate demasiado pequeno |
|--------|---------------------------|----------------------------|
| Sintoma | Locks frecuentes, performance lenta | Invariantes rotas entre entidades |
| Causa | Incluye demasiadas entidades | Separo entidades que cambian juntas |
| Solucion | Extraer entidades a su propio Aggregate + ref por ID | Unificar en un solo Aggregate |

**Regla practica:** Un Aggregate debe ser lo suficientemente grande para proteger sus invariantes, y lo suficientemente pequeno para no causar contention.

### 3.5 Referencia entre Aggregates

```typescript
// ✅ CORRECTO — Referencia por ID
class Order extends AggregateRoot<OrderId> {
  private _customerId: CustomerId;  // Solo el ID, no la entidad Customer
}

// ❌ INCORRECTO — Referencia directa
class Order extends AggregateRoot<OrderId> {
  private _customer: Customer;  // Referencia directa a otro Aggregate
}
```

---

## 4. Domain Events

### 4.1 Definicion

Un Domain Event representa **algo que ocurrio** en el dominio que es relevante para otros componentes. Son inmutables y en tiempo pasado.

### 4.2 Reglas

1. **Inmutables** — una vez creados, no cambian
2. **Tiempo pasado** — `OrderCreated`, no `CreateOrder`
3. **Contienen datos suficientes** — el consumidor no necesita llamar al emisor
4. **Registrados en el Aggregate** — se recogen al persistir

### 4.3 Patron

```typescript
// ── Interfaz Base ─────────────────────────────────
export interface DomainEvent {
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly payload: Record<string, unknown>;
}

// ── Evento Concreto ───────────────────────────────
export class OrderSubmittedEvent implements DomainEvent {
  static readonly EVENT_TYPE = "order.submitted";

  readonly eventType = OrderSubmittedEvent.EVENT_TYPE;
  readonly occurredAt: Date;
  readonly payload: {
    readonly orderId: string;
    readonly customerId: string;
    readonly totalAmount: number;
    readonly itemCount: number;
  };

  constructor(data: {
    orderId: string;
    customerId: string;
    totalAmount: number;
    itemCount: number;
  }) {
    this.occurredAt = new Date();
    this.payload = Object.freeze(data);
  }
}
```

### 4.4 Collect-and-Dispatch

Los eventos se registran en el Aggregate y se despachan DESPUES de persistir:

```typescript
// En el Use Case
async execute(command: SubmitOrderCommand): Promise<Result<OrderError, void>> {
  const order = await this.repository.findById(command.orderId);
  if (!order) return Result.fail(new OrderNotFoundError(command.orderId));

  const result = order.submit();
  if (result.isFail()) return result;

  // 1. Persistir primero
  await this.repository.save(order);

  // 2. Despachar eventos DESPUES de persistir exitosamente
  const events = order.clearEvents();
  await this.eventPublisher.publishAll(events);

  return Result.ok();
}
```

### 4.5 Tipos de Eventos

| Tipo | Scope | Ejemplo | Consumidores |
|------|-------|---------|-------------|
| **Domain Event** | Dentro del Bounded Context | `OrderSubmitted` | Otros Use Cases del contexto |
| **Integration Event** | Entre Bounded Contexts | `order-context.order.submitted` | Otros contextos |

Los Integration Events son DTOs puros sin referencias a objetos de dominio. Se definen en un contrato compartido.

---

## 5. Repository

### 5.1 Definicion

Un Repository proporciona la **ilusion de una coleccion en memoria** de Aggregates. Es un Port (interfaz) en el dominio, con implementaciones en infraestructura.

### 5.2 Reglas

1. **Un Repository por Aggregate Root** — nunca por Entity o Value Object
2. **Interfaz en Domain** — implementacion en Infrastructure
3. **Retorna Aggregates completos** — nunca parciales
4. **Persiste Aggregates completos** — nunca parciales

### 5.3 Patron

```typescript
// ── Port (Domain Layer) ───────────────────────────
export interface OrderRepository {
  findById(id: OrderId): Promise<Order | null>;
  save(order: Order): Promise<void>;
  delete(id: OrderId): Promise<void>;
  exists(id: OrderId): Promise<boolean>;

  // Metodos de consulta de dominio (no genericos)
  findByCustomer(customerId: CustomerId): Promise<Order[]>;
  findPendingOrders(): Promise<Order[]>;
}

// ── Adapter (Infrastructure Layer) ────────────────
export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders: Map<string, Order> = new Map();

  async findById(id: OrderId): Promise<Order | null> {
    return this.orders.get(id.toString()) ?? null;
  }

  async save(order: Order): Promise<void> {
    this.orders.set(order.id.toString(), order);
  }

  async delete(id: OrderId): Promise<void> {
    this.orders.delete(id.toString());
  }

  async exists(id: OrderId): Promise<boolean> {
    return this.orders.has(id.toString());
  }

  async findByCustomer(customerId: CustomerId): Promise<Order[]> {
    return [...this.orders.values()].filter(o => o.customerId.equals(customerId));
  }

  async findPendingOrders(): Promise<Order[]> {
    return [...this.orders.values()].filter(o => o.status === OrderStatus.SUBMITTED);
  }
}
```

### 5.4 Repository vs DAO vs Query Service

| Aspecto | Repository | DAO | Query Service |
|---------|-----------|-----|--------------|
| Retorna | Aggregates de dominio | DTOs/rows crudos | DTOs optimizados |
| Capa | Domain (Port) | Infrastructure | Application/Infrastructure |
| Proposito | Persistir/recuperar Aggregates | CRUD generico | Queries complejas, reportes |
| Reconstitution | Si (toPersistence/fromPersistence) | No | No |

---

## 6. Domain Services

### 6.1 Definicion

Un Domain Service encapsula **logica de dominio que no pertenece naturalmente a ningun Aggregate**. Generalmente involucra multiples Aggregates o calculo complejo.

### 6.2 Cuando usar

```
✅ NECESARIO                             ❌ NO NECESARIO
───────────────────────────────────────────────────────────────
Logica que involucra 2+ Aggregates       Logica que cabe en un Aggregate
Calculo complejo del dominio             CRUD simple
Politicas de dominio que cruzan objetos  Orquestacion (eso es Application Service)
Validacion cross-aggregate               Integracion con servicios externos
```

### 6.3 Ejemplo

```typescript
// Domain Service: calcula pricing con reglas complejas
export class PricingService {
  calculateDiscount(
    customer: Customer,
    order: Order,
    promotions: Promotion[],
  ): Money {
    let discount = Money.zero(order.totalAmount.currency);

    // Regla 1: Descuento por volumen
    if (order.items.length > 10) {
      discount = discount.add(order.totalAmount.percentage(5));
    }

    // Regla 2: Descuento por lealtad
    if (customer.loyaltyTier === LoyaltyTier.GOLD) {
      discount = discount.add(order.totalAmount.percentage(10));
    }

    // Regla 3: Promociones activas
    for (const promo of promotions) {
      if (promo.appliesTo(order)) {
        discount = discount.add(promo.calculateDiscount(order));
      }
    }

    // Invariante: descuento no supera 30%
    const maxDiscount = order.totalAmount.percentage(30);
    return discount.isGreaterThan(maxDiscount) ? maxDiscount : discount;
  }
}
```

---

## 7. Specification Pattern

### 7.1 Definicion

Una Specification encapsula una **regla de negocio** que puede evaluarse contra un objeto. Se puede componer con AND, OR, NOT.

### 7.2 Patron Base

```typescript
export abstract class Specification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;

  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }

  not(): Specification<T> {
    return new NotSpecification(this);
  }
}

class AndSpecification<T> extends Specification<T> {
  constructor(private left: Specification<T>, private right: Specification<T>) { super(); }
  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }
}

class OrSpecification<T> extends Specification<T> {
  constructor(private left: Specification<T>, private right: Specification<T>) { super(); }
  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }
}

class NotSpecification<T> extends Specification<T> {
  constructor(private spec: Specification<T>) { super(); }
  isSatisfiedBy(candidate: T): boolean {
    return !this.spec.isSatisfiedBy(candidate);
  }
}
```

### 7.3 Uso

```typescript
class IsGoldCustomer extends Specification<Customer> {
  isSatisfiedBy(customer: Customer): boolean {
    return customer.loyaltyTier === LoyaltyTier.GOLD;
  }
}

class HasMinimumOrderValue extends Specification<Order> {
  constructor(private readonly minimum: Money) { super(); }
  isSatisfiedBy(order: Order): boolean {
    return order.totalAmount.isGreaterOrEqual(this.minimum);
  }
}

class IsEligibleForFreeShipping extends Specification<Order> {
  constructor(private readonly minimum: Money) { super(); }
  isSatisfiedBy(order: Order): boolean {
    return new HasMinimumOrderValue(this.minimum)
      .isSatisfiedBy(order);
  }
}

// Composicion
const eligibleForPromo = new IsGoldCustomer()
  .and(new HasRecentPurchase(30));

if (eligibleForPromo.isSatisfiedBy(customer)) {
  // aplicar promo
}
```

---

## 8. Result Pattern

### 8.1 Definicion

El Result Pattern reemplaza excepciones para flujos de error **esperados** en el dominio. Las excepciones se reservan para situaciones excepcionales (bug, infra down).

### 8.2 Patron

```typescript
export class Result<E, T> {
  private constructor(
    private readonly _value?: T,
    private readonly _error?: E,
  ) {}

  static ok<E, T>(value: T): Result<E, T> {
    return new Result<E, T>(value, undefined);
  }

  static fail<E, T>(error: E): Result<E, T> {
    return new Result<E, T>(undefined, error);
  }

  isOk(): boolean { return this._error === undefined; }
  isFail(): boolean { return this._error !== undefined; }

  get value(): T {
    if (this.isFail()) throw new Error("Cannot get value of failed Result");
    return this._value!;
  }

  get error(): E {
    if (this.isOk()) throw new Error("Cannot get error of successful Result");
    return this._error!;
  }

  map<U>(fn: (value: T) => U): Result<E, U> {
    if (this.isFail()) return Result.fail(this._error!);
    return Result.ok(fn(this._value!));
  }

  flatMap<U>(fn: (value: T) => Result<E, U>): Result<E, U> {
    if (this.isFail()) return Result.fail(this._error!);
    return fn(this._value!);
  }
}
```

### 8.3 Cuando Result vs Exception

| Usar Result | Usar Exception |
|-------------|---------------|
| Validacion fallida (esperado) | Bug en el codigo (inesperado) |
| Entidad no encontrada | Null pointer / undefined access |
| Regla de negocio violada | Infra down (DB, network) |
| Transicion de estado invalida | Programacion incorrecta |

---

## 9. Domain Errors

### 9.1 Jerarquia

```typescript
// ── Error Base ────────────────────────────────────
export abstract class DomainError {
  constructor(
    readonly message: string,
    readonly code: string,
    readonly metadata?: Record<string, unknown>,
  ) {}
}

// ── Errores Base Reutilizables ────────────────────
export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with id '${id}' not found`, "NOT_FOUND", { entity, id });
  }
}

export class ValidationError extends DomainError {
  constructor(entity: string, field: string, reason: string) {
    super(`${entity}.${field}: ${reason}`, "VALIDATION_ERROR", { entity, field, reason });
  }
}

export class ConflictError extends DomainError {
  constructor(entity: string, reason: string) {
    super(`${entity}: ${reason}`, "CONFLICT", { entity, reason });
  }
}

export class InvalidTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`Invalid transition from '${from}' to '${to}'`, "INVALID_TRANSITION", { from, to });
  }
}

// ── Union Type por Modulo ─────────────────────────
export type OrderError =
  | OrderNotFoundError
  | OrderValidationError
  | OrderNotEditableError
  | EmptyOrderError
  | DuplicateItemError;
```

---

## 10. Resumen: Reglas de Oro

| Regla | Descripcion |
|-------|-------------|
| **Aggregate = Transaction Boundary** | Una transaccion modifica exactamente un Aggregate |
| **Referencia por ID** | Aggregates se referencian por ID, nunca por referencia directa |
| **Constructor privado** | Solo `create()` (nuevo) y `reconstitute()` (desde persistencia) |
| **Eventos en mutaciones** | `create()` y metodos de negocio registran eventos; `reconstitute()` nunca |
| **Value Objects para conceptos** | Todo lo que no necesita identidad es un Value Object |
| **Repository por Aggregate** | Un Repository por Aggregate Root, retorna Aggregates completos |
| **Domain Service para logica cross-aggregate** | Cuando la logica no encaja en un solo Aggregate |
| **Result para errores esperados** | Excepciones solo para bugs e infraestructura |
| **Specifications para reglas composables** | Cuando las reglas se combinan o reutilizan |
| **Invariantes en el Aggregate** | Las reglas de consistencia viven dentro del Aggregate |

---

*Skill de patrones tacticos DDD — Complementa ddd-context-design (klay+-specific) con patrones genericos de referencia*
