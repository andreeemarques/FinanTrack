import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AlterarPasswordDto } from './dto/alterar-password.dto';
import { ApagarContaDto } from './dto/apagar-conta.dto';
import { AtualizarPerfilDto } from './dto/atualizar-perfil.dto';
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

const MENSAGEM_EMAIL_REPETIDO = 'Já existe uma conta com este email.';

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
      throw new ConflictException(MENSAGEM_EMAIL_REPETIDO);
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

  async atualizarPerfil(id: string, dto: AtualizarPerfilDto) {
    const utilizador = await this.obterUtilizador(id);
    const mudaEmail = dto.email !== undefined && dto.email !== utilizador.email;

    if (mudaEmail) {
      await this.confirmarPassword(utilizador.hashPassword, dto.passwordAtual);
    }

    try {
      return await this.prisma.utilizador.update({
        where: { id },
        data: { nome: dto.nome, email: mudaEmail ? dto.email : undefined },
        select: CAMPOS_PUBLICOS,
      });
    } catch (erro) {
      // P2002 = violação de unicidade (email já usado por outra conta)
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === 'P2002'
      ) {
        throw new ConflictException(MENSAGEM_EMAIL_REPETIDO);
      }
      throw erro;
    }
  }

  async alterarPassword(id: string, dto: AlterarPasswordDto) {
    const utilizador = await this.obterUtilizador(id);
    await this.confirmarPassword(utilizador.hashPassword, dto.passwordAtual);

    await this.prisma.utilizador.update({
      where: { id },
      data: { hashPassword: await hash(dto.novaPassword, 12) },
    });
  }

  async apagarConta(id: string, dto: ApagarContaDto) {
    const utilizador = await this.obterUtilizador(id);
    await this.confirmarPassword(utilizador.hashPassword, dto.password);

    // Os movimentos apagam-se primeiro: a ligação movimento → categoria é RESTRICT,
    // e se a base de dados tentasse apagar as categorias antes dos movimentos, falharia.
    // O resto (categorias, orçamentos, objetivos e contribuições) cai em cascata.
    await this.prisma.$transaction([
      this.prisma.movimento.deleteMany({ where: { utilizadorId: id } }),
      this.prisma.utilizador.delete({ where: { id } }),
    ]);
  }

  private async obterUtilizador(id: string) {
    const utilizador = await this.prisma.utilizador.findUnique({ where: { id } });
    if (!utilizador) throw new UnauthorizedException();
    return utilizador;
  }

  // 400 e não 401, para o frontend não confundir com "sessão expirada"
  private async confirmarPassword(hashPassword: string, password?: string) {
    if (!password || !(await compare(password, hashPassword))) {
      throw new BadRequestException('A password atual está incorreta.');
    }
  }

  private gerarToken(utilizador: { id: string; email: string }) {
    return this.jwt.signAsync({ sub: utilizador.id, email: utilizador.email });
  }
}