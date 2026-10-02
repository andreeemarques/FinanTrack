import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AtualizarCategoriaDto } from './dto/atualizar-categoria.dto';
import { CriarCategoriaDto } from './dto/criar-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  listar(utilizadorId: string) {
    return this.prisma.categoria.findMany({
      where: { utilizadorId },
      orderBy: { nome: 'asc' },
    });
  }

  async criar(utilizadorId: string, dto: CriarCategoriaDto) {
    try {
      return await this.prisma.categoria.create({
        data: { ...dto, utilizadorId },
      });
    } catch (erro) {
      return this.repassarErro(erro);
    }
  }

  async atualizar(id: string, utilizadorId: string, dto: AtualizarCategoriaDto) {
    await this.obter(id, utilizadorId);
    try {
      return await this.prisma.categoria.update({ where: { id }, data: dto });
    } catch (erro) {
      return this.repassarErro(erro);
    }
  }

  async remover(id: string, utilizadorId: string) {
    await this.obter(id, utilizadorId);

    const emUso = await this.prisma.movimento.count({
      where: { categoriaId: id },
    });
    if (emUso > 0) {
      throw new ConflictException(
        `Não é possível apagar: a categoria tem ${emUso} movimento(s) associado(s).`,
      );
    }

    await this.prisma.categoria.delete({ where: { id } });
  }

  // Devolve 404 também quando a categoria é de outro utilizador (não revela que existe)
  private async obter(id: string, utilizadorId: string) {
    const categoria = await this.prisma.categoria.findFirst({
      where: { id, utilizadorId },
    });
    if (!categoria) throw new NotFoundException('Categoria não encontrada.');
    return categoria;
  }

  // P2002 = violação de unicidade (utilizador + nome)
  private repassarErro(erro: unknown): never {
    if (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === 'P2002'
    ) {
      throw new ConflictException('Já existe uma categoria com esse nome.');
    }
    throw erro;
  }
}