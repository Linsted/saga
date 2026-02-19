import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RmqContext, RmqOptions, Transport } from '@nestjs/microservices';

interface RmqChannel {
  ack(message: any): void;
}

@Injectable()
export class RmqService {
  constructor(private readonly configService: ConfigService) {}

  ack(context: RmqContext) {
    const channel = context.getChannelRef() as unknown as RmqChannel;
    const originalMsg = context.getMessage() as unknown;

    channel.ack(originalMsg);
  }

  getOptions(queue: string, noAck = false): RmqOptions {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.configService.get<string>('RABBITMQ_URI') || ''],
        queue: this.configService.get<string>(`RABBITMQ_${queue}_QUEUE`),
        noAck,
        persistent: true,
      },
    };
  }
}
