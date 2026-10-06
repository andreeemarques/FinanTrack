import { IsString, MaxLength, MinLength } from 'class-validator';

export class AlterarPasswordDto {
  @IsString()
  passwordAtual: string;

  // 72 é o limite de bytes do bcrypt
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  novaPassword: string;
}