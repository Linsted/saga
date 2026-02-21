import { Module } from '@nestjs/common';
import { TaskServiceController } from './task-service.controller';
import { TaskServiceService } from './task-service.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Task } from './entity/task.entity';
import { RmqModule } from '@app/common';

@Module({
  imports: [
    RmqModule.register({ name: 'BILLING_SERVICE' }),
    TypeOrmModule.forFeature([Task]),
    ConfigModule.forRoot({
      envFilePath: './.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: 'localhost',
        port: 5434,
        username: configService.get<string>('POSTGRES_TASK_USER'),
        password: configService.get<string>('POSTGRES_TASK_PW'),
        database: configService.get<string>('POSTGRES_TASK_DB'),
        entities: [Task], // Сюди потім додамо Task
        synchronize: true, //! false on prod
      }),
    }),
  ],
  controllers: [TaskServiceController],
  providers: [TaskServiceService],
})
export class TaskServiceModule {}
