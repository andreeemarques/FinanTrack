import { applyDecorators } from '@nestjs/common';
import { IsISO8601, Matches } from 'class-validator';

// Aceita apenas datas no formato AAAA-MM-DD (e rejeita datas inexistentes, como 2026-02-31)
export function DataISO() {
  return applyDecorators(
    Matches(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'A data deve ter o formato AAAA-MM-DD.',
    }),
    IsISO8601({ strict: true }, { message: 'A data é inválida.' }),
  );
}