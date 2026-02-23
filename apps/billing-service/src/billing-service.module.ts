import { Module } from '@nestjs/common';
import { BillingServiceController } from './billing-service.controller';
import { BillingServiceService } from './billing-service.service';
import { RmqModule } from '@app/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    RmqModule.register({ name: 'TASK_SERVICE' }),
    ConfigModule.forRoot({
      envFilePath: './.env',
      isGlobal: true,
    }),
  ],
  controllers: [BillingServiceController],
  providers: [BillingServiceService],
})
export class BillingServiceModule {}
