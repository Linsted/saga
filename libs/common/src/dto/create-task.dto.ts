import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(1)
  price: number;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
