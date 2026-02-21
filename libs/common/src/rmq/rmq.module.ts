import { Module, DynamicModule } from '@nestjs/common';
import { RmqService } from './rmq.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

interface RmqModuleOptions {
  name: string;
}

/**
 * ⚠️ Чому ми маємо два різні конфіги для RabbitMQ:
 * * 1. RmqModule.register() [Для Відправника / ClientProxy]:
 * Тут НЕМАЄ `noAck: false`. NestJS під капотом створює тимчасові черги
 * для відповідей (Direct reply-to), які не підтримують ручне підтвердження.
 * Використання `noAck: false` тут призведе до помилки 406 PRECONDITION-FAILED.
 * * 2. RmqService.getOptions() [Для Слухача / Consumer в main.ts]:
 * Тут ОБОВ'ЯЗКОВО `noAck: false` (ручний ack). Це гарантує, що повідомлення
 * не видалиться з черги автоматично. Якщо сервіс впаде під час запису в БД,
 * повідомлення повернеться в чергу і дані не будуть втрачені.
 */
@Module({
  providers: [RmqService],
  exports: [RmqService],
})
export class RmqModule {
  static register({ name }: RmqModuleOptions): DynamicModule {
    return {
      module: RmqModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
              return {
                transport: Transport.RMQ,
                options: {
                  urls: [configService.get<string>('RABBITMQ_URI') || ''],
                  queue: configService.get<string>(`RABBITMQ_${name}_QUEUE`),
                  // noAck: false,
                  persistent: true,
                },
              };
            },
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}
