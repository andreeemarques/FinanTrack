import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegistarDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nome: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email: string;

  // 72 é o limite de bytes do bcrypt
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}