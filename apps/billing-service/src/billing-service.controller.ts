import { Controller, Get } from '@nestjs/common';
import { BillingServiceService } from './billing-service.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { RmqService, TaskCreatedEvent } from '@app/common';

@Controller()
export class BillingServiceController {
  constructor(
    private readonly billingServiceService: BillingServiceService,
    private readonly rmqService: RmqService,
  ) {}

  @Get()
  getHello(): string {
    return this.billingServiceService.getHello();
  }

  @EventPattern('task_created')
  async handleTaskCreated(
    @Payload() data: TaskCreatedEvent, // Типізуємо вхідні дані нашим контрактом
    @Ctx() context: RmqContext,
  ) {
    try {
      console.log('📦 Отримано нове повідомлення з RabbitMQ:', data);

      await this.billingServiceService.processPayment(data);

      console.log('✅ Логіка виконана успішно. Робимо ACK.');

      // Підтверджуємо успішну обробку повідомлення
      this.rmqService.ack(context);
    } catch (error) {
      console.error('❌ Помилка під час обробки платежу:', error);
      // Ми НЕ робимо ack() у разі помилки. Повідомлення залишиться в черзі.
    }
  }
}
