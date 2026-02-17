Це чудова ідея. Документація для "шарених" бібліотек критично важлива, бо інші розробники (або ти сам через місяць) мають розуміти, як правильно підключати черги, не копаючись у вихідному коді.

Ось готовий `README.md` файл, який ти можеш покласти в папку `libs/common/src/rmq/` або додати у загальну документацію проєкту (наприклад, у Wiki).

Я структурував його так: **Що це -> Як налаштувати -> Як відправляти -> Як приймати -> Чому так зроблено.**

---

# 🐰 RabbitMQ Shared Module (`libs/common/rmq`)

Цей модуль надає стандартизовану обгортку над `@nestjs/microservices` для роботи з RabbitMQ.
Він забезпечує єдину конфігурацію, керування з'єднаннями та реалізує патерн **Manual Acknowledgment** (ручне підтвердження) для гарантії доставки повідомлень (At-least-once delivery).

## 📋 Основні можливості

* **Dynamic Module Registration:** Автоматичне підключення до черг на основі змінних оточення.
* **Manual Ack Support:** Хелпер `RmqService` для безпечного підтвердження повідомлень.
* **Type Safety:** Власні інтерфейси для роботи з каналами AMQP без необхідності тягнути важкі типи `amqplib` у кожен мікросервіс.
* **Resiliency:** Налаштовано на `persistent` повідомлення та `noAck: false`.

---

## ⚙️ Налаштування (Environment Variables)

Модуль очікує наступні змінні оточення у файлі `.env`:

```env
# Загальний URI для підключення
RABBITMQ_URI=amqp://guest:guest@localhost:5672

# Назви черг для конкретних сервісів
# Шаблон: RABBITMQ_{SERVICE_NAME}_QUEUE
RABBITMQ_BILLING_QUEUE=billing
RABBITMQ_TASKS_QUEUE=tasks

```

---

## 🚀 Використання

### 1. Підключення модуля (Imports)

Імпортуйте `RmqModule` у `AppModule` вашого мікросервісу.
Метод `register` приймає ім'я сервісу, до якого ви хочете **відправляти** повідомлення.

```typescript
// apps/tasks/src/app.module.ts
import { Module } from '@nestjs/common';
import { RmqModule } from '@app/common';

@Module({
  imports: [
    // Реєструємо клієнта для спілкування з Billing Service
    RmqModule.register({
      name: 'BILLING_SERVICE', 
    }),
  ],
})
export class AppModule {}

```

*Примітка: При реєстрації з ім'ям `'BILLING_SERVICE'`, модуль автоматично шукатиме змінну оточення `RABBITMQ_BILLING_SERVICE_QUEUE` (або ви можете налаштувати логіку імен у `RmqModule`).*

### 2. Відправка повідомлень (Producer)

Використовуйте стандартний `@Inject()` для отримання `ClientProxy`.

```typescript
// apps/tasks/src/tasks.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @Inject('BILLING_SERVICE') private billingClient: ClientProxy,
  ) {}

  async createTask(dto: CreateTaskDto) {
    // ... логіка збереження в БД ...
    
    // Відправка події в чергу
    this.billingClient.emit('task_created', {
      taskId: task.id,
      ...dto
    });
  }
}

```

### 3. Отримання та обробка (Consumer)

Для обробки повідомлень використовуйте декоратор `@EventPattern` (або `@MessagePattern`) та наш `RmqService` для підтвердження.

**Важливо:** Ми використовуємо ручний Ack. Якщо ви не викличете `rmqService.ack()`, повідомлення повернеться в чергу і буде оброблено знову!

```typescript
// apps/billing/src/billing.controller.ts
import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { RmqService } from '@app/common';

@Controller()
export class BillingController {
  constructor(private readonly rmqService: RmqService) {}

  @EventPattern('task_created')
  async handleTaskCreated(
    @Payload() data: any, 
    @Ctx() context: RmqContext
  ) {
    // 1. Виконуємо бізнес-логіку
    console.log('Знімаємо гроші за таск:', data);

    // 2. Підтверджуємо успішну обробку
    // Тільки після цього RabbitMQ видалить повідомлення
    this.rmqService.ack(context);
  }
}

```

---

## 🛠 Технічні деталі

### RmqService & Ack Logic

Ми використовуємо кастомну реалізацію `ack`, щоб уникнути конфліктів типів лінтера та помилок `unsafe assignment`.

```typescript
// libs/common/src/rmq/rmq.service.ts
interface RmqChannel {
  ack(message: any): void;
}

ack(context: RmqContext) {
  const channel = context.getChannelRef() as unknown as RmqChannel;
  const originalMsg = context.getMessage() as unknown;
  channel.ack(originalMsg);
}

```

### Чому Manual Ack?

За замовчуванням NestJS використовує Auto-Ack (повідомлення видаляється відразу після отримання).
У розподілених транзакціях (Saga) це небезпечно: якщо сервіс впаде під час запису в БД, повідомлення зникне, і транзакція залишиться незавершеною.
Ми використовуємо `noAck: false` (ручний режим), щоб гарантувати **атомарність**:

> "Повідомлення вважається обробленим тільки тоді, коли воно успішно збережено в БД".

---

### ✅ Best Practices

1. Завжди викликайте `rmqService.ack(context)` в самому кінці методу (`finally` блок або після `await`).
2. Операції в контролері мають бути **ідемпотентними**. RabbitMQ може доставити повідомлення двічі (наприклад, якщо Ack загубився в мережі). Перевіряйте, чи не обробляли ви цей `taskId` раніше.