import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export interface PayloadJwt {
  sub: string; // id do utilizador
  email: string;
  v: number; // versão do token (sobe quando a password muda)
}

export type PedidoAutenticado = Request & { utilizador?: PayloadJwt };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const pedido = context.switchToHttp().getRequest<PedidoAutenticado>();
    const [tipo, token] = pedido.headers.authorization?.split(' ') ?? [];

    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException();
    }

    let payload: PayloadJwt;
    try {
      payload = await this.jwt.verifyAsync<PayloadJwt>(token);
    } catch {
      throw new UnauthorizedException();
    }

    // A conta tem de existir e o token não pode ter sido invalidado
    const utilizador = await this.prisma.utilizador.findUnique({
      where: { id: payload.sub },
      select: { versaoToken: true },
    });
    if (!utilizador || utilizador.versaoToken !== payload.v) {
      throw new UnauthorizedException();
    }

    pedido.utilizador = payload;
    return true;
  }
}