import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { TaskServiceService } from './task-service.service';
import { CreateTaskDto } from '@app/common';

@Controller()
export class TaskServiceController {
  constructor(private readonly taskServiceService: TaskServiceService) {}

  @Get()
  getHello(): string {
    return this.taskServiceService.getHello();
  }

  @HttpCode(201)
  @Post()
  createTask(@Body() createTaskDto: CreateTaskDto) {
    return this.taskServiceService.createTask(createTaskDto);
  }
}
