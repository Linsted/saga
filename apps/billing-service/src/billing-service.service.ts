import { TaskCreatedEvent } from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class BillingServiceService {
  constructor(
    // Інжектимо наш сервіс для ручного підтвердження
    @Inject('TASK_SERVICE') private readonly taskClient: ClientProxy,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async processPayment(data: TaskCreatedEvent) {
    console.log(`💳 Імітуємо зняття коштів для таска ${data.taskId}...`);

    // Імітуємо затримку роботи БД (опціонально)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Імітуємо успішну оплату (тут могла бути логіка if (balance >= price))
    const isSuccess = true;

    if (isSuccess) {
      console.log(`✅ Оплата успішна. Відправляємо подію 'billing_success'`);
      // Відправляємо подію назад у Task Service
      this.taskClient.emit('billing_success', {
        taskId: data.taskId,
        status: 'SUCCESS',
      });
    } else {
      console.log(`❌ Недостатньо коштів. Відправляємо подію 'billing_failed'`);
      this.taskClient.emit('billing_failed', {
        taskId: data.taskId,
        status: 'FAILED',
        reason: 'Insufficient funds',
      });
    }

    return isSuccess;
  }
}
