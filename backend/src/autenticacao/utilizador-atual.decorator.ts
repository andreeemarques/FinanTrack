import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PayloadJwt, PedidoAutenticado } from './jwt-auth.guard';

// Uso: @UtilizadorAtual() utilizador: PayloadJwt
export const UtilizadorAtual = createParamDecorator(
  (_dados: unknown, contexto: ExecutionContext): PayloadJwt | undefined => {
    return contexto.switchToHttp().getRequest<PedidoAutenticado>().utilizador;
  },
);