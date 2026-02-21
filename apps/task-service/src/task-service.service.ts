import { CreateTaskDto, TaskCreatedEvent } from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entity/task.entity';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class TaskServiceService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @Inject('BILLING_SERVICE')
    private readonly billingClient: ClientProxy,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async createTask(createTaskDto: CreateTaskDto) {
    const task = this.taskRepository.create(createTaskDto);
    const savedTask = await this.taskRepository.save(task);

    const createdEvent = new TaskCreatedEvent(
      savedTask.id,
      savedTask.userId,
      savedTask.price,
    );

    await lastValueFrom(this.billingClient.emit('task_created', createdEvent));

    return savedTask;
  }
}
