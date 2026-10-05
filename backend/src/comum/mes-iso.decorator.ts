import { Matches } from 'class-validator';

// Aceita apenas meses no formato AAAA-MM
export const MesISO = () =>
  Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'O mês deve ter o formato AAAA-MM.',
  });