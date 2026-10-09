import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { CATEGORIAS_PADRAO } from '../autenticacao/categorias-padrao';
import { inicioDoMes, mesAtual } from '../comum/mes';
import { PrismaService } from '../prisma/prisma.service';
import { gerarDadosDemo } from './dados-demo';

const HORAS_DE_VIDA = 24;

// Máximo de contas de demonstração ao mesmo tempo (configurável com DEMO_MAX_ATIVAS)
function maximoDeDemosAtivas() {
  const valor = Number(process.env.DEMO_MAX_ATIVAS);
  return Number.isInteger(valor) && valor > 0 ? valor : 100;
}

@Injectable()
export class DemoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async criarSessao() {
    // Lida diretamente do ambiente, para se poder ligar e desligar nos testes
    if (process.env.DEMO_ATIVA !== 'true') throw new NotFoundException();

    await this.limparContasAntigas();

    // Limite global: protege a base de dados mesmo que o pedido venha de muitos IPs diferentes
    const ativas = await this.prisma.utilizador.count({ where: { ehDemo: true } });
    if (ativas >= maximoDeDemosAtivas()) {
      throw new ServiceUnavailableException(
        'A demonstração está momentaneamente indisponível. Tenta novamente mais tarde.',
      );
    }

    // Ninguém conhece a password desta conta: o acesso é só através do token devolvido
    const email = `demo-${randomBytes(6).toString('hex')}@demo.finantrack.local`;
    const hashPassword = await hash(randomBytes(24).toString('hex'), 4);

    const utilizador = await this.prisma.utilizador.create({
      data: {
        nome: 'Visitante',
        email,
        hashPassword,
        ehDemo: true,
        categorias: { create: CATEGORIAS_PADRAO.map((nome) => ({ nome })) },
      },
      select: { id: true, nome: true, email: true, moeda: true, ehDemo: true, versaoToken: true },
    });

    await this.preencherDados(utilizador.id);

    const { versaoToken, ...publico } = utilizador;
    const token = await this.jwt.signAsync({ sub: utilizador.id, email, v: versaoToken });
    return { utilizador: publico, token };
  }

  private async preencherDados(utilizadorId: string) {
    const categorias = await this.prisma.categoria.findMany({
      where: { utilizadorId },
      select: { id: true, nome: true },
    });
    const idDa = (nome: string) => {
      const categoria = categorias.find((c) => c.nome === nome);
      if (!categoria) throw new Error(`Categoria de demonstração em falta: ${nome}`);
      return categoria.id;
    };

    const dados = gerarDadosDemo(new Date());

    await this.prisma.movimento.createMany({
      data: dados.movimentos.map((m) => ({
        utilizadorId,
        categoriaId: idDa(m.categoria),
        tipo: m.tipo,
        valorCentimos: m.valorCentimos,
        data: new Date(m.data),
        descricao: m.descricao,
        metodoPagamento: m.metodoPagamento,
      })),
    });

    await this.prisma.orcamento.createMany({
      data: dados.orcamentos.map((o) => ({
        utilizadorId,
        categoriaId: idDa(o.categoria),
        limiteCentimos: o.limiteCentimos,
        mes: inicioDoMes(mesAtual()),
      })),
    });

    for (const objetivo of dados.objetivos) {
      await this.prisma.objetivoPoupanca.create({
        data: {
          utilizadorId,
          nome: objetivo.nome,
          metaCentimos: objetivo.metaCentimos,
          dataLimite: objetivo.dataLimite ? new Date(objetivo.dataLimite) : null,
          contribuicoes: {
            create: objetivo.contribuicoes.map((c) => ({
              valorCentimos: c.valorCentimos,
              data: new Date(c.data),
            })),
          },
        },
      });
    }
  }

  // Só apaga contas de demonstração com mais de 24 horas; as contas normais nunca são tocadas
  private async limparContasAntigas() {
    const antigas = {
      ehDemo: true,
      criadoEm: { lt: new Date(Date.now() - HORAS_DE_VIDA * 3_600_000) },
    };
    // Os movimentos apagam-se primeiro (a ligação movimento → categoria é RESTRICT);
    // o resto cai em cascata com o utilizador
    await this.prisma.$transaction([
      this.prisma.movimento.deleteMany({ where: { utilizador: antigas } }),
      this.prisma.utilizador.deleteMany({ where: antigas }),
    ]);
  }
}