import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class TaskCreatedEvent {
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  price: number;

  constructor(taskId: string, userId: string, price: number) {
    this.taskId = taskId;
    this.userId = userId;
    this.price = price;
  }
}

export class BillingSuccessEvent {
  @IsString()
  @IsNotEmpty()
  taskId: string;

  constructor(taskId: string) {
    this.taskId = taskId;
  }
}

export class BillingFailedEvent {
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  constructor(taskId: string, reason: string) {
    this.taskId = taskId;
    this.reason = reason;
  }
}
