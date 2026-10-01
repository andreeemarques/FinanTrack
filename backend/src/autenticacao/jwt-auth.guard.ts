import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface PayloadJwt {
  sub: string; // id do utilizador
  email: string;
}

export type PedidoAutenticado = Request & { utilizador?: PayloadJwt };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const pedido = context.switchToHttp().getRequest<PedidoAutenticado>();
    const [tipo, token] = pedido.headers.authorization?.split(' ') ?? [];

    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException();
    }

    try {
      pedido.utilizador = await this.jwt.verifyAsync<PayloadJwt>(token);
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}