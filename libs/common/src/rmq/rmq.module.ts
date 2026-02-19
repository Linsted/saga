import { Module, DynamicModule } from '@nestjs/common';
import { RmqService } from './rmq.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

interface RmqModuleOptions {
  name: string;
}

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
                  noAck: false,
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
