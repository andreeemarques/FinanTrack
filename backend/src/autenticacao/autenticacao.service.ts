import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { EntrarDto } from './dto/entrar.dto';
import { RegistarDto } from './dto/registar.dto';

const CATEGORIAS_PADRAO = [
  'Alimentação',
  'Habitação',
  'Transportes',
  'Entretenimento',
  'Saúde',
  'Salário',
  'Outros',
];

const CAMPOS_PUBLICOS = { id: true, nome: true, email: true, moeda: true };

@Injectable()
export class AutenticacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async registar(dto: RegistarDto) {
    const existente = await this.prisma.utilizador.findUnique({
      where: { email: dto.email },
    });
    if (existente) {
      throw new ConflictException('Já existe uma conta com este email.');
    }

    const hashPassword = await hash(dto.password, 12);

    const utilizador = await this.prisma.utilizador.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        hashPassword,
        categorias: { create: CATEGORIAS_PADRAO.map((nome) => ({ nome })) },
      },
      select: CAMPOS_PUBLICOS,
    });

    return { utilizador, token: await this.gerarToken(utilizador) };
  }

  async entrar(dto: EntrarDto) {
    const utilizador = await this.prisma.utilizador.findUnique({
      where: { email: dto.email },
    });

    const valida = utilizador
      ? await compare(dto.password, utilizador.hashPassword)
      : false;

    // mesma mensagem nos dois casos, para não revelar se o email existe
    if (!utilizador || !valida) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const { id, nome, email, moeda } = utilizador;
    const publico = { id, nome, email, moeda };
    return { utilizador: publico, token: await this.gerarToken(publico) };
  }

  async perfil(id: string) {
    const utilizador = await this.prisma.utilizador.findUnique({
      where: { id },
      select: CAMPOS_PUBLICOS,
    });
    if (!utilizador) throw new UnauthorizedException();
    return utilizador;
  }

  private gerarToken(utilizador: { id: string; email: string }) {
    return this.jwt.signAsync({ sub: utilizador.id, email: utilizador.email });
  }
}