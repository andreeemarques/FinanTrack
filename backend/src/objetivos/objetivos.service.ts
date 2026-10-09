import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { inicioDoMes, mesAtual, inicioDoMesSeguinte } from '../comum/mes';
import type { Contribuicao, ObjetivoPoupanca } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AtualizarObjetivoDto } from './dto/atualizar-objetivo.dto';
import { CriarContribuicaoDto } from './dto/criar-contribuicao.dto';
import { CriarObjetivoDto } from './dto/criar-objetivo.dto';
import { preverConclusao } from './previsao';
import { LimitesService } from '../prisma/limites.service';



const paraData = (data: Date) => data.toISOString().slice(0, 10);

// undefined = não mexer; null = apagar; string = nova data
function converterData(valor?: string | null): Date | null | undefined {
  if (valor === undefined) return undefined;
  return valor === null ? null : new Date(valor);
}

interface Agregado {
  _sum: { valorCentimos: number | null };
  _min: { data: Date | null };
}



const paraContribuicao = (c: Contribuicao) => ({
  id: c.id,
  valorCentimos: c.valorCentimos,
  data: paraData(c.data),
});

@Injectable()
export class ObjetivosService {
  constructor(private readonly prisma: PrismaService, private readonly limites: LimitesService) {}

  async listar(utilizadorId: string) {
    const objetivos = await this.prisma.objetivoPoupanca.findMany({
      where: { utilizadorId },
      orderBy: { criadoEm: 'asc' },
    });
    const ids = objetivos.map((o) => o.id);
    const agregados = await this.agregar(ids);

    const esteMes = await this.prisma.contribuicao.aggregate({
        where: {
            objetivoId: { in: ids },
            data: { gte: inicioDoMes(mesAtual()), lt: inicioDoMesSeguinte(mesAtual()) },
        },
      _sum: { valorCentimos: true },
    });

    const hoje = new Date();
    const itens = objetivos.map((o) => this.montarItem(o, agregados.get(o.id), hoje));

    return {
      totais: {
        poupadoCentimos: itens.reduce((soma, i) => soma + i.poupadoCentimos, 0),
        metaCentimos: itens.reduce((soma, i) => soma + i.metaCentimos, 0),
        poupadoEsteMesCentimos: esteMes._sum.valorCentimos ?? 0,
      },
      objetivos: itens,
    };
  }

  async criar(utilizadorId: string, dto: CriarObjetivoDto) {
    await this.limites.garantirEspaco(utilizadorId, 'objetivos');
    if (dto.dataLimite && dto.dataLimite < paraData(new Date())) {
      throw new BadRequestException('A data limite não pode ser anterior a hoje.');
    }
    const objetivo = await this.prisma.objetivoPoupanca.create({
      data: {
        utilizadorId,
        nome: dto.nome,
        metaCentimos: dto.metaCentimos,
        dataLimite: converterData(dto.dataLimite) ?? null,
      },
    });
    return this.montarItem(objetivo, undefined, new Date());
  }

  async atualizar(id: string, utilizadorId: string, dto: AtualizarObjetivoDto) {
    await this.garantirObjetivo(id, utilizadorId);
    const objetivo = await this.prisma.objetivoPoupanca.update({
      where: { id },
      data: {
        nome: dto.nome,
        metaCentimos: dto.metaCentimos,
        dataLimite: converterData(dto.dataLimite),
      },
    });
    const agregados = await this.agregar([id]);
    return this.montarItem(objetivo, agregados.get(id), new Date());
  }

  async remover(id: string, utilizadorId: string) {
    await this.garantirObjetivo(id, utilizadorId);
    await this.prisma.objetivoPoupanca.delete({ where: { id } }); // apaga também as contribuições
  }

  async listarContribuicoes(id: string, utilizadorId: string) {
    await this.garantirObjetivo(id, utilizadorId);
    const contribuicoes = await this.prisma.contribuicao.findMany({
      where: { objetivoId: id },
      orderBy: [{ data: 'desc' }, { criadoEm: 'desc' }],
    });
    return contribuicoes.map(paraContribuicao);
  }

  async adicionarContribuicao(
    id: string,
    utilizadorId: string,
    dto: CriarContribuicaoDto,
  ) {
    await this.garantirObjetivo(id, utilizadorId);
    await this.limites.garantirEspaco(utilizadorId, 'contribuicoes');
    const contribuicao = await this.prisma.contribuicao.create({
      data: {
        objetivoId: id,
        valorCentimos: dto.valorCentimos,
        data: new Date(dto.data ?? paraData(new Date())),
      },
    });
    return paraContribuicao(contribuicao);
  }

  async removerContribuicao(id: string, contribuicaoId: string, utilizadorId: string) {
    const contribuicao = await this.prisma.contribuicao.findFirst({
      where: { id: contribuicaoId, objetivoId: id, objetivo: { utilizadorId } },
      select: { id: true },
    });
    if (!contribuicao) throw new NotFoundException('Contribuição não encontrada.');
    await this.prisma.contribuicao.delete({ where: { id: contribuicaoId } });
  }

  // Soma e primeira data das contribuições de cada objetivo
  private async agregar(ids: string[]) {
    const agregados = await this.prisma.contribuicao.groupBy({
      by: ['objetivoId'],
      where: { objetivoId: { in: ids } },
      _sum: { valorCentimos: true },
      _min: { data: true },
    });
    return new Map<string, Agregado>(agregados.map((a) => [a.objetivoId, a]));
  }

  private montarItem(objetivo: ObjetivoPoupanca, agregado: Agregado | undefined, hoje: Date) {
    const poupadoCentimos = agregado?._sum.valorCentimos ?? 0;
    return {
      id: objetivo.id,
      nome: objetivo.nome,
      metaCentimos: objetivo.metaCentimos,
      dataLimite: objetivo.dataLimite ? paraData(objetivo.dataLimite) : null,
      poupadoCentimos,
      concluido: poupadoCentimos >= objetivo.metaCentimos,
      previsaoConclusao: preverConclusao(
        objetivo.metaCentimos,
        poupadoCentimos,
        agregado?._min.data ?? null,
        hoje,
      ),
    };
  }

  // 404 também quando o objetivo é de outro utilizador (não revela que existe)
  private async garantirObjetivo(id: string, utilizadorId: string) {
    const objetivo = await this.prisma.objetivoPoupanca.findFirst({
      where: { id, utilizadorId },
      select: { id: true },
    });
    if (!objetivo) throw new NotFoundException('Objetivo não encontrado.');
  }
}