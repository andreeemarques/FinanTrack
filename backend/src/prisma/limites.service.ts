import { ForbiddenException, Injectable } from '@nestjs/common';
import { LIMITES } from '../comum/limites';
import type { Recurso } from '../comum/limites';
import { PrismaService } from './prisma.service';

const NOMES: Record<Recurso, string> = {
  movimentos: 'movimentos',
  categorias: 'categorias',
  orcamentos: 'orçamentos',
  objetivos: 'objetivos de poupança',
  contribuicoes: 'contribuições',
};

@Injectable()
export class LimitesService {
  constructor(private readonly prisma: PrismaService) {}

  // Recusa a criação quando o utilizador já atingiu o limite desse recurso
  async garantirEspaco(utilizadorId: string, recurso: Recurso) {
    const utilizador = await this.prisma.utilizador.findUnique({
      where: { id: utilizadorId },
      select: { ehDemo: true },
    });
    const ehDemo = utilizador?.ehDemo ?? false;
    const limite = LIMITES[ehDemo ? 'demo' : 'normal'][recurso];

    if ((await this.contar(utilizadorId, recurso)) >= limite) {
      throw new ForbiddenException(
        `Atingiste o limite de ${limite} ${NOMES[recurso]} por conta${ehDemo ? ' de demonstração' : ''}.`,
      );
    }
  }

  private contar(utilizadorId: string, recurso: Recurso) {
    switch (recurso) {
      case 'movimentos':
        return this.prisma.movimento.count({ where: { utilizadorId } });
      case 'categorias':
        return this.prisma.categoria.count({ where: { utilizadorId } });
      case 'orcamentos':
        return this.prisma.orcamento.count({ where: { utilizadorId } });
      case 'objetivos':
        return this.prisma.objetivoPoupanca.count({ where: { utilizadorId } });
      case 'contribuicoes':
        return this.prisma.contribuicao.count({ where: { objetivo: { utilizadorId } } });
    }
  }
}