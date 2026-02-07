


# 📋 Project Backlog: Distributed Saga Pattern (NestJS)

Цей проект реалізує патерн Saga (Choreography-based) для розподіленої системи, що складається з `Task Service` та `Billing Service`.

---

## 🚀 Epic 1: Infrastructure & Shared Modules (Common)
> **Ціль:** Налаштувати "кровоносну систему" (RabbitMQ) та спільні контракти, щоб сервіси могли "розуміти" один одного.

### 🎫 Task-004: Docker Environment Setup
**Summary:** Налаштувати docker-compose для RabbitMQ та незалежних БД.
**Description:** Нам потрібно підняти інфраструктуру, де кожен сервіс має ізольовану БД, але спільну шину повідомлень.

**Acceptance Criteria:**
- [ ] RabbitMQ запущено з Management Plugin (порти `5672`, `15672`).
- [ ] Postgres піднято. Створено дві логічні БД: `tasks_db` та `billing_db` (або два контейнери на різних портах, наприклад `5432` та `5433`).
- [ ] Налаштовано змінні оточення (`.env`) для кожного сервісу в Monorepo (`RABBITMQ_URI`, `POSTGRES_URI`).

### 🎫 Task-005: Implement RmqModule in Shared Lib
**Summary:** Реалізувати абстракцію `RmqModule` в `libs/common`.
**Description:** Щоб не дублювати код підключення до черги в кожному мікросервісі. Цей модуль має автоматизувати підключення та обробку Ack (підтвердження отримання).

**Acceptance Criteria:**
- [ ] Створено динамічний модуль `RmqModule`.
- [ ] Реалізовано сервіс `RmqService` з методом `ack(context: RmqContext)`, який робить ручний `channel.ack(originalMsg)`.
- [ ] **Важливо:** Увімкнено `noAck: false` за замовчуванням (щоб повідомлення не губилися, якщо сервіс впаде під час обробки).
- [ ] Модуль та сервіс експортовано в `index.ts` бібліотеки `common`.

### 🎫 Task-006: Define Saga Event Contracts (DTOs)
**Summary:** Описати спільні DTO подій.
**Description:** Визначити структуру даних, якими обмінюватимуться сервіси, використовуючи `class-validator`.

**Acceptance Criteria:**
- [ ] В `libs/common` створено DTOs:
    - `CreateTaskDto` (вхідні дані).
    - `TaskCreatedEvent` (містить `taskId`, `userId`, `cost`).
    - `BillingSuccessEvent` (містить `taskId`).
    - `BillingFailedEvent` (містить `taskId`, `reason`).
- [ ] Всі поля провалідовані через декоратори `class-validator`.

---

## 💃 Epic 2: Core Business Logic & Saga Choreography
> **Ціль:** Реалізувати логіку "Створити таск -> Зняти гроші -> Підтвердити таск".

### 🎫 Task-007: Task Service - Initial State (PENDING)
**Summary:** Реалізувати створення таска та публікацію події.
**Description:** При отриманні запиту, TaskService має зберегти таск у БД і сповістити BillingService.

**Acceptance Criteria:**
- [ ] Підключено Postgres та TypeORM. Створено сутність `Task` (поля: `status: ['PENDING', 'APPROVED', 'REJECTED']`, `price`, `userId`).
- [ ] Реалізовано ендпоінт `POST /tasks`:
    - [ ] Створюється запис у БД зі статусом `PENDING`.
    - [ ] Публікується подія `task_created` у RabbitMQ (використовуючи `RmqService`).
    - [ ] Клієнту повертається `201 Created` (без очікування відповіді білінгу).

### 🎫 Task-008: Billing Service - Process Payment
**Summary:** Реалізувати обробку платежу.
**Description:** BillingService має слухати чергу, перевіряти баланс юзера і емітити результат.

**Acceptance Criteria:**
- [ ] Сервіс підписаний на патерн `task_created`.
- [ ] Реалізовано бізнес-логіку:
    - [ ] Знайти юзера в `billing_db`.
    - [ ] **Успіх:** Якщо баланс >= ціна таска -> Зняти кошти, зберегти транзакцію, емітити `billing_success`.
    - [ ] **Провал:** Якщо баланс < ціна -> Емітити `billing_failed`.
- [ ] **Важливо:** Використати `RmqService.ack()` тільки після успішного запису в БД (атомарність обробки).

### 🎫 Task-009: Saga Finalization (Task Service)
**Summary:** Реалізувати реакцію на відповідь білінгу (Saga Steps).
**Description:** TaskService має слухати відповіді від BillingService і фіналізувати статус таска.

**Acceptance Criteria:**
- [ ] TaskService слухає патерн `billing_success`:
    - [ ] Знаходить таск за ID.
    - [ ] Змінює статус на `APPROVED`.
    - [ ] Робить Ack.
- [ ] TaskService слухає патерн `billing_failed`:
    - [ ] Знаходить таск за ID.
    - [ ] Зміню