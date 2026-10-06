import { Injectable } from '@nestjs/common';
import {
  formatarDia,
  inicioDoMes,
  inicioDoMesSeguinte,
  listarMeses,
  mesAtual,
  somarMeses,
} from '../comum/mes';
import { TipoMovimento } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Periodo } from './dto/consultar-relatorios.dto';

interface LinhaMensal {
  mes: string;
  receitas: number;
  despesas: number;
}

// Variação percentual com uma casa decimal; null quando não há base de comparação
function variacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return Math.round(((atual - anterior) / Math.abs(anterior)) * 1000) / 10;
}

@Injectable()
export class ResumoService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(utilizadorId: string, mes: string = mesAtual()) {
    const anterior = somarMeses(mes, -1);
    const serie = await this.serieMensal(utilizadorId, mes);

    const doMes = (m: string) =>
      serie.find((l) => l.mes === m) ?? { mes: m, receitas: 0, despesas: 0 };
    const saldoAte = (m: string) =>
      serie
        .filter((l) => l.mes <= m)
        .reduce((soma, l) => soma + l.receitas - l.despesas, 0);

    const [poupado, poupadoAnterior, despesasPorCategoria] = await Promise.all([
      this.poupadoNoMes(utilizadorId, mes),
      this.poupadoNoMes(utilizadorId, anterior),
      this.despesasPorCategoria(utilizadorId, mes, mes),
    ]);

    const atual = doMes(mes);
    const anteriorMes = doMes(anterior);
    const saldoCentimos = saldoAte(mes);

    return {
      mes,
      saldoCentimos,
      receitasCentimos: atual.receitas,
      despesasCentimos: atual.despesas,
      poupadoCentimos: poupado,
      variacoes: {
        saldo: variacao(saldoCentimos, saldoAte(anterior)),
        receitas: variacao(atual.receitas, anteriorMes.receitas),
        despesas: variacao(atual.despesas, anteriorMes.despesas),
        poupado: variacao(poupado, poupadoAnterior),
      },
      evolucaoSaldo: listarMeses(somarMeses(mes, -5), mes).map((m) => ({
        mes: m,
        saldoCentimos: saldoAte(m),
      })),
      despesasPorCategoria,
    };
  }

  async relatorios(utilizadorId: string, periodo: Periodo = '6meses') {
    const fim = mesAtual();
    const inicio = periodo === 'ano' ? `${fim.slice(0, 4)}-01` : somarMeses(fim, -5);
    const meses = listarMeses(inicio, fim);

    const serie = await this.serieMensal(utilizadorId, fim);
    const mensal = meses.map((m) => {
      const linha = serie.find((l) => l.mes === m);
      return {
        mes: m,
        receitasCentimos: linha?.receitas ?? 0,
        despesasCentimos: linha?.despesas ?? 0,
      };
    });

    const totalReceitas = mensal.reduce((soma, m) => soma + m.receitasCentimos, 0);
    const totalDespesas = mensal.reduce((soma, m) => soma + m.despesasCentimos, 0);
    const categorias = await this.despesasPorCategoria(utilizadorId, inicio, fim);
    const maior = categorias[0];

    return {
      periodo: { de: inicio, ate: fim, meses: meses.length },
      mensal,
      mediaMensalDespesasCentimos: Math.round(totalDespesas / meses.length),
      maiorCategoria: maior
        ? {
            nome: maior.categoria.nome,
            valorCentimos: maior.valorCentimos,
            percentagem: maior.percentagem,
          }
        : null,
      taxaPoupancaPercentagem:
        totalReceitas > 0
          ? Math.round(((totalReceitas - totalDespesas) / totalReceitas) * 1000) / 10
          : null,
    };
  }

  // Receitas e despesas por mês, desde o início até ao fim do mês indicado, numa só query
  private async serieMensal(utilizadorId: string, ate: string): Promise<LinhaMensal[]> {
    const fim = formatarDia(inicioDoMesSeguinte(ate));

    const linhas = await this.prisma.$queryRaw<
      { mes: string; receitas: bigint; despesas: bigint }[]
    >`
      SELECT to_char(data, 'YYYY-MM') AS mes,
             COALESCE(SUM(valor_centimos) FILTER (WHERE tipo = 'RECEITA'), 0)::bigint AS receitas,
             COALESCE(SUM(valor_centimos) FILTER (WHERE tipo = 'DESPESA'), 0)::bigint AS despesas
      FROM movimentos
      WHERE utilizador_id = ${utilizadorId}::uuid
        AND data < ${fim}::date
      GROUP BY 1
      ORDER BY 1
    `;

    return linhas.map((l) => ({
      mes: l.mes,
      receitas: Number(l.receitas),
      despesas: Number(l.despesas),
    }));
  }

  // Total das contribuições para objetivos num mês
  private async poupadoNoMes(utilizadorId: string, mes: string) {
    const resultado = await this.prisma.contribuicao.aggregate({
      where: {
        objetivo: { utilizadorId },
        data: { gte: inicioDoMes(mes), lt: inicioDoMesSeguinte(mes) },
      },
      _sum: { valorCentimos: true },
    });
    return resultado._sum.valorCentimos ?? 0;
  }

  // Despesas por categoria entre dois meses (inclusivos), da maior para a menor
  private async despesasPorCategoria(utilizadorId: string, de: string, ate: string) {
    const grupos = await this.prisma.movimento.groupBy({
      by: ['categoriaId'],
      where: {
        utilizadorId,
        tipo: TipoMovimento.DESPESA,
        data: { gte: inicioDoMes(de), lt: inicioDoMesSeguinte(ate) },
      },
      _sum: { valorCentimos: true },
    });

    const categorias = await this.prisma.categoria.findMany({
      where: { utilizadorId, id: { in: grupos.map((g) => g.categoriaId) } },
      select: { id: true, nome: true, cor: true },
    });
    const total = grupos.reduce((soma, g) => soma + (g._sum.valorCentimos ?? 0), 0);

    return grupos
      .flatMap((g) => {
        const categoria = categorias.find((c) => c.id === g.categoriaId);
        const valorCentimos = g._sum.valorCentimos ?? 0;
        if (!categoria) return [];
        return [
          {
            categoria,
            valorCentimos,
            percentagem: total > 0 ? Math.round((valorCentimos / total) * 1000) / 10 : 0,
          },
        ];
      })
      .sort((a, b) => b.valorCentimos - a.valorCentimos);
  }
}