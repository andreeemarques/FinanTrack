import { IsString } from 'class-validator';

export class ApagarContaDto {
  @IsString()
  password: string;
}