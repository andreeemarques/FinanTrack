import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash, hashSync } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CATEGORIAS_PADRAO } from './categorias-padrao';
import { AlterarPasswordDto } from './dto/alterar-password.dto';
import { ApagarContaDto } from './dto/apagar-conta.dto';
import { AtualizarPerfilDto } from './dto/atualizar-perfil.dto';
import { EntrarDto } from './dto/entrar.dto';
import { RegistarDto } from './dto/registar.dto';
import {
  DURACAO_SESSAO_MS,
  RETENCAO_ROTADAS_MS,
  TOLERANCIA_ROTACAO_MS,
  gerarRefreshToken,
  hashRefresh,
} from './sessao';

const CAMPOS_PUBLICOS = { id: true, nome: true, email: true, moeda: true, ehDemo: true };

const MENSAGEM_EMAIL_REPETIDO = 'Já existe uma conta com este email.';

// Usado no login quando o email não existe, para a resposta demorar o mesmo tempo
// e não ser possível descobrir que emails estão registados
const HASH_FALSO = hashSync('password-falsa-para-igualar-tempos', 12);

interface DadosToken {
  id: string;
  email: string;
  versaoToken: number;
}

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

    const criado = await this.prisma.utilizador.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        hashPassword,
        categorias: { create: CATEGORIAS_PADRAO.map((nome) => ({ nome })) },
      },
      select: { ...CAMPOS_PUBLICOS, versaoToken: true },
    });

    const { versaoToken, ...utilizador } = criado;
    const sessao = await this.iniciarSessao({
      id: utilizador.id,
      email: utilizador.email,
      versaoToken,
    });
    return { utilizador, ...sessao };
  }

  async entrar(dto: EntrarDto) {
    const utilizador = await this.prisma.utilizador.findUnique({
      where: { email: dto.email },
    });

    // A comparação corre sempre, mesmo que o email não exista
    const igual = await compare(dto.password, utilizador?.hashPassword ?? HASH_FALSO);

    // mesma mensagem nos dois casos, para não revelar se o email existe
    if (!utilizador || !igual) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const { id, nome, email, moeda, ehDemo, versaoToken } = utilizador;
    const sessao = await this.iniciarSessao({ id, email, versaoToken });
    return { utilizador: { id, nome, email, moeda, ehDemo }, ...sessao };
  }

  // Troca um refresh token por um token de acesso novo e um refresh token novo (rotação)
  async renovar(refreshToken?: string) {
    if (!refreshToken) throw new UnauthorizedException();

    const agora = new Date();
    const sessao = await this.prisma.sessao.findUnique({
      where: { hashToken: hashRefresh(refreshToken) },
      include: { utilizador: { select: { ...CAMPOS_PUBLICOS, versaoToken: true } } },
    });
    if (!sessao || sessao.expiraEm <= agora) throw new UnauthorizedException();

    if (sessao.rodadaEm) {
      const passou = agora.getTime() - sessao.rodadaEm.getTime();
      if (passou > TOLERANCIA_ROTACAO_MS) {
        // Um token já trocado foi usado outra vez: pode ter sido roubado.
        // Termina a sessão toda (o token novo da mesma cadeia deixa de funcionar também).
        await this.prisma.sessao.deleteMany({ where: { familiaId: sessao.familiaId } });
        throw new UnauthorizedException();
      }
      // Dentro da tolerância: pedidos simultâneos legítimos (por exemplo, dois separadores)
    } else {
      // Condicional e atómico: se outro pedido já trocou este token, não faz nada
      await this.prisma.sessao.updateMany({
        where: { id: sessao.id, rodadaEm: null },
        data: { rodadaEm: agora },
      });
    }

    const { versaoToken, ...utilizador } = sessao.utilizador;
    const novos = await this.iniciarSessao(
      { id: utilizador.id, email: utilizador.email, versaoToken },
      sessao.familiaId,
    );

    await this.limparSessoesAntigas(agora);
    return { utilizador, ...novos };
  }

  // Termina a sessão do dispositivo (a cadeia de tokens a que o cookie pertence)
  async sair(refreshToken?: string) {
    if (!refreshToken) return;
    const sessao = await this.prisma.sessao.findUnique({
      where: { hashToken: hashRefresh(refreshToken) },
      select: { familiaId: true },
    });
    if (sessao) {
      await this.prisma.sessao.deleteMany({ where: { familiaId: sessao.familiaId } });
    }
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

  // Sobe a versão do token (os tokens de acesso antigos deixam de valer) e termina todas
  // as sessões, em todos os dispositivos. Abre uma sessão nova só para este.
  async alterarPassword(id: string, dto: AlterarPasswordDto) {
    const utilizador = await this.obterUtilizador(id);
    await this.confirmarPassword(utilizador.hashPassword, dto.passwordAtual);

    const atualizado = await this.prisma.utilizador.update({
      where: { id },
      data: {
        hashPassword: await hash(dto.novaPassword, 12),
        versaoToken: { increment: 1 },
      },
      select: { id: true, email: true, versaoToken: true },
    });

    await this.prisma.sessao.deleteMany({ where: { utilizadorId: id } });
    return this.iniciarSessao(atualizado);
  }

  async apagarConta(id: string, dto: ApagarContaDto) {
    const utilizador = await this.obterUtilizador(id);
    await this.confirmarPassword(utilizador.hashPassword, dto.password);

    // Os movimentos apagam-se primeiro: a ligação movimento → categoria é RESTRICT,
    // e se a base de dados tentasse apagar as categorias antes dos movimentos, falharia.
    // O resto (categorias, orçamentos, objetivos, contribuições e sessões) cai em cascata.
    await this.prisma.$transaction([
      this.prisma.movimento.deleteMany({ where: { utilizadorId: id } }),
      this.prisma.utilizador.delete({ where: { id } }),
    ]);
  }

  // Cria uma sessão nova (ou continua uma família, na rotação) e devolve os dois tokens.
  // O refresh token só existe aqui em claro: na base de dados fica apenas o hash.
  async iniciarSessao(utilizador: DadosToken, familiaId: string = randomUUID()) {
    const refreshToken = gerarRefreshToken();
    await this.prisma.sessao.create({
      data: {
        utilizadorId: utilizador.id,
        familiaId,
        hashToken: hashRefresh(refreshToken),
        expiraEm: new Date(Date.now() + DURACAO_SESSAO_MS),
      },
    });
    return { token: await this.gerarToken(utilizador), refreshToken };
  }

  // Apaga as sessões expiradas e os tokens trocados há mais de 24 horas
  private limparSessoesAntigas(agora: Date) {
    return this.prisma.sessao.deleteMany({
      where: {
        OR: [
          { expiraEm: { lt: agora } },
          { rodadaEm: { lt: new Date(agora.getTime() - RETENCAO_ROTADAS_MS) } },
        ],
      },
    });
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

  private gerarToken(utilizador: DadosToken) {
    return this.jwt.signAsync({
      sub: utilizador.id,
      email: utilizador.email,
      v: utilizador.versaoToken,
    });
  }
}