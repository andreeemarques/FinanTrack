import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AtualizarMovimentoDto } from './dto/atualizar-movimento.dto';
import { CriarMovimentoDto } from './dto/criar-movimento.dto';
import { ListarMovimentosDto } from './dto/listar-movimentos.dto';

const INCLUIR_CATEGORIA = {
  categoria: { select: { id: true, nome: true, icone: true, cor: true } },
} satisfies Prisma.MovimentoInclude;

type MovimentoComCategoria = Prisma.MovimentoGetPayload<{
  include: typeof INCLUIR_CATEGORIA;
}>;

// A coluna "data" guarda só o dia, por isso devolvemo-la como "AAAA-MM-DD"
const paraResposta = (movimento: MovimentoComCategoria) => ({
  ...movimento,
  data: movimento.data.toISOString().slice(0, 10),
});

@Injectable()
export class MovimentosService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(utilizadorId: string, dto: CriarMovimentoDto) {
    await this.garantirCategoria(dto.categoriaId, utilizadorId);

    const movimento = await this.prisma.movimento.create({
      data: { ...dto, data: new Date(dto.data), utilizadorId },
      include: INCLUIR_CATEGORIA,
    });
    return paraResposta(movimento);
  }

  async listar(utilizadorId: string, filtros: ListarMovimentosDto) {
    const { pagina, limite, tipo, categoriaId, de, ate, pesquisa } = filtros;

    const where: Prisma.MovimentoWhereInput = { utilizadorId };
    if (tipo) where.tipo = tipo;
    if (categoriaId) where.categoriaId = categoriaId;
    if (pesquisa) {
      where.descricao = { contains: pesquisa, mode: 'insensitive' };
    }
    if (de || ate) {
      where.data = {
        gte: de ? new Date(de) : undefined,
        lte: ate ? new Date(ate) : undefined,
      };
    }

    const [movimentos, total] = await this.prisma.$transaction([
      this.prisma.movimento.findMany({
        where,
        include: INCLUIR_CATEGORIA,
        orderBy: [{ data: 'desc' }, { criadoEm: 'desc' }],
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.movimento.count({ where }),
    ]);

    return {
      dados: movimentos.map(paraResposta),
      meta: { pagina, limite, total, totalPaginas: Math.ceil(total / limite) },
    };
  }

  async obter(id: string, utilizadorId: string) {
    const movimento = await this.prisma.movimento.findFirst({
      where: { id, utilizadorId },
      include: INCLUIR_CATEGORIA,
    });
    if (!movimento) throw new NotFoundException('Movimento não encontrado.');
    return paraResposta(movimento);
  }

  async atualizar(id: string, utilizadorId: string, dto: AtualizarMovimentoDto) {
    await this.garantirExiste(id, utilizadorId);
    if (dto.categoriaId) {
      await this.garantirCategoria(dto.categoriaId, utilizadorId);
    }

    const movimento = await this.prisma.movimento.update({
      where: { id },
      data: { ...dto, data: dto.data ? new Date(dto.data) : undefined },
      include: INCLUIR_CATEGORIA,
    });
    return paraResposta(movimento);
  }

  async remover(id: string, utilizadorId: string) {
    await this.garantirExiste(id, utilizadorId);
    await this.prisma.movimento.delete({ where: { id } });
  }

  // 404 também quando o movimento é de outro utilizador (não revela que existe)
  private async garantirExiste(id: string, utilizadorId: string) {
    const movimento = await this.prisma.movimento.findFirst({
      where: { id, utilizadorId },
      select: { id: true },
    });
    if (!movimento) throw new NotFoundException('Movimento não encontrado.');
  }

  // A categoria tem de existir e ser do próprio utilizador
  private async garantirCategoria(categoriaId: string, utilizadorId: string) {
    const categoria = await this.prisma.categoria.findFirst({
      where: { id: categoriaId, utilizadorId },
      select: { id: true },
    });
    if (!categoria) throw new BadRequestException('Categoria inválida.');
  }
}