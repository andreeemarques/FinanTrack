import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  formatarMes,
  inicioDoMes,
  inicioDoMesSeguinte,
  mesAtual,
} from '../comum/mes';
import { Prisma, TipoMovimento } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AtualizarOrcamentoDto } from './dto/atualizar-orcamento.dto';
import { CriarOrcamentoDto } from './dto/criar-orcamento.dto';

const INCLUIR_CATEGORIA = {
  categoria: { select: { id: true, nome: true, icone: true, cor: true } },
} satisfies Prisma.OrcamentoInclude;

type OrcamentoComCategoria = Prisma.OrcamentoGetPayload<{
  include: typeof INCLUIR_CATEGORIA;
}>;

const paraResposta = (orcamento: OrcamentoComCategoria) => ({
  id: orcamento.id,
  mes: formatarMes(orcamento.mes),
  categoria: orcamento.categoria,
  limiteCentimos: orcamento.limiteCentimos,
});

@Injectable()
export class OrcamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(utilizadorId: string, mes: string = mesAtual()) {
    const inicio = inicioDoMes(mes);

    const orcamentos = await this.prisma.orcamento.findMany({
      where: { utilizadorId, mes: inicio },
      include: INCLUIR_CATEGORIA,
      orderBy: { categoria: { nome: 'asc' } },
    });

    // Soma das despesas do mês, por categoria, só das categorias com orçamento
    const gastos = await this.prisma.movimento.groupBy({
      by: ['categoriaId'],
      where: {
        utilizadorId,
        tipo: TipoMovimento.DESPESA,
        data: { gte: inicio, lt: inicioDoMesSeguinte(mes) },
        categoriaId: { in: orcamentos.map((o) => o.categoriaId) },
      },
      _sum: { valorCentimos: true },
    });
    const gastoPorCategoria = new Map(
      gastos.map((g) => [g.categoriaId, g._sum.valorCentimos ?? 0]),
    );

    const itens = orcamentos.map((o) => {
      const gastoCentimos = gastoPorCategoria.get(o.categoriaId) ?? 0;
      return {
        id: o.id,
        categoria: o.categoria,
        limiteCentimos: o.limiteCentimos,
        gastoCentimos,
        restanteCentimos: o.limiteCentimos - gastoCentimos, // negativo se ultrapassou
      };
    });

    const limiteCentimos = itens.reduce((soma, i) => soma + i.limiteCentimos, 0);
    const gastoCentimos = itens.reduce((soma, i) => soma + i.gastoCentimos, 0);

    return {
      mes,
      totais: {
        limiteCentimos,
        gastoCentimos,
        disponivelCentimos: limiteCentimos - gastoCentimos,
      },
      orcamentos: itens,
    };
  }

  async criar(utilizadorId: string, dto: CriarOrcamentoDto) {
    const categoria = await this.prisma.categoria.findFirst({
      where: { id: dto.categoriaId, utilizadorId },
      select: { id: true },
    });
    if (!categoria) throw new BadRequestException('Categoria inválida.');

    try {
      const orcamento = await this.prisma.orcamento.create({
        data: {
          utilizadorId,
          categoriaId: dto.categoriaId,
          limiteCentimos: dto.limiteCentimos,
          mes: inicioDoMes(dto.mes),
        },
        include: INCLUIR_CATEGORIA,
      });
      return paraResposta(orcamento);
    } catch (erro) {
      // P2002 = violação de unicidade (utilizador + categoria + mês)
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe um orçamento para esta categoria neste mês.',
        );
      }
      throw erro;
    }
  }

  async atualizar(id: string, utilizadorId: string, dto: AtualizarOrcamentoDto) {
    await this.garantirExiste(id, utilizadorId);
    const orcamento = await this.prisma.orcamento.update({
      where: { id },
      data: { limiteCentimos: dto.limiteCentimos },
      include: INCLUIR_CATEGORIA,
    });
    return paraResposta(orcamento);
  }

  async remover(id: string, utilizadorId: string) {
    await this.garantirExiste(id, utilizadorId);
    await this.prisma.orcamento.delete({ where: { id } });
  }

  // 404 também quando o orçamento é de outro utilizador (não revela que existe)
  private async garantirExiste(id: string, utilizadorId: string) {
    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id, utilizadorId },
      select: { id: true },
    });
    if (!orcamento) throw new NotFoundException('Orçamento não encontrado.');
  }
}