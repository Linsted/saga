import { NestFactory } from '@nestjs/core';
import { BillingServiceModule } from './billing-service.module';
import { AsyncMicroserviceOptions } from '@nestjs/microservices';
import { RmqService } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<AsyncMicroserviceOptions>(
    BillingServiceModule,
    {
      inject: [RmqService],
      useFactory: (rmqService: RmqService) =>
        rmqService.getOptions('BILLING_SERVICE'),
    },
  );
  await app.listen();
}
bootstrap();
