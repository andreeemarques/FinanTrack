import request from 'supertest';
import { LIMITES } from '../src/comum/limites';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  AplicacaoTeste,
  autorizacao,
  criarApp,
  limparBaseDeDados,
  registarUtilizador,
} from './ajudantes';

describe('Limites por conta (e2e)', () => {
  let app: AplicacaoTeste;
  let prisma: PrismaService;
  let id: string;
  let token: string;
  let categoriaId: string;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await criarApp();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    process.env.DEMO_ATIVA = 'true';
    await limparBaseDeDados(app);

    const demo = await http().post('/demo/sessao').expect(201);
    id = demo.body.utilizador.id;
    token = demo.body.token;

    const categorias = await http().get('/categorias').set(autorizacao(token)).expect(200);
    categoriaId = categorias.body[0].id;
  });
  afterAll(async () => {
    await app.close();
  });

  it('recusa movimentos acima do limite (403)', async () => {
    const existentes = await prisma.movimento.count({ where: { utilizadorId: id } });
    await prisma.movimento.createMany({
      data: Array.from({ length: LIMITES.demo.movimentos - existentes }, () => ({
        utilizadorId: id,
        categoriaId,
        tipo: 'DESPESA' as const,
        valorCentimos: 100,
        data: new Date('2026-01-15'),
        descricao: 'Enchimento',
        metodoPagamento: 'CARTAO' as const,
      })),
    });

    const resposta = await http()
      .post('/movimentos')
      .set(autorizacao(token))
      .send({
        tipo: 'DESPESA',
        valorCentimos: 100,
        data: '2026-01-15',
        descricao: 'Um a mais',
        metodoPagamento: 'CARTAO',
        categoriaId,
      })
      .expect(403);
    expect(resposta.body.message).toContain(`${LIMITES.demo.movimentos} movimentos`);
  });

  it('recusa categorias acima do limite (403)', async () => {
    const existentes = await prisma.categoria.count({ where: { utilizadorId: id } });
    await prisma.categoria.createMany({
      data: Array.from({ length: LIMITES.demo.categorias - existentes }, (_, i) => ({
        utilizadorId: id,
        nome: `Extra ${i}`,
      })),
    });

    await http().post('/categorias').set(autorizacao(token)).send({ nome: 'Uma a mais' }).expect(403);
  });

  it('recusa orçamentos acima do limite (403)', async () => {
    const existentes = await prisma.orcamento.count({ where: { utilizadorId: id } });
    await prisma.orcamento.createMany({
      data: Array.from({ length: LIMITES.demo.orcamentos - existentes }, (_, i) => ({
        utilizadorId: id,
        categoriaId,
        limiteCentimos: 1000,
        mes: new Date(Date.UTC(2020, i, 1)),
      })),
    });

    await http()
      .post('/orcamentos')
      .set(autorizacao(token))
      .send({ categoriaId, limiteCentimos: 1000, mes: '2019-01' })
      .expect(403);
  });

  it('recusa objetivos acima do limite (403)', async () => {
    const existentes = await prisma.objetivoPoupanca.count({ where: { utilizadorId: id } });
    await prisma.objetivoPoupanca.createMany({
      data: Array.from({ length: LIMITES.demo.objetivos - existentes }, (_, i) => ({
        utilizadorId: id,
        nome: `Objetivo ${i}`,
        metaCentimos: 1000,
      })),
    });

    await http()
      .post('/objetivos')
      .set(autorizacao(token))
      .send({ nome: 'Um a mais', metaCentimos: 1000 })
      .expect(403);
  });

  it('recusa contribuições acima do limite (403)', async () => {
    const objetivos = await http().get('/objetivos').set(autorizacao(token)).expect(200);
    const objetivoId = objetivos.body.objetivos[0].id as string;

    const existentes = await prisma.contribuicao.count({ where: { objetivo: { utilizadorId: id } } });
    await prisma.contribuicao.createMany({
      data: Array.from({ length: LIMITES.demo.contribuicoes - existentes }, () => ({
        objetivoId,
        valorCentimos: 100,
        data: new Date('2026-01-15'),
      })),
    });

    await http()
      .post(`/objetivos/${objetivoId}/contribuicoes`)
      .set(autorizacao(token))
      .send({ valorCentimos: 100 })
      .expect(403);
  });

  it('as contas normais têm limites mais largos do que as de demonstração', async () => {
    const normal = await registarUtilizador(app, 'Ana', 'ana@example.com');
    const existentes = await prisma.categoria.count({ where: { utilizadorId: normal.id } });
    await prisma.categoria.createMany({
      data: Array.from({ length: LIMITES.demo.categorias - existentes }, (_, i) => ({
        utilizadorId: normal.id,
        nome: `Extra ${i}`,
      })),
    });

    // Na demo isto daria 403; numa conta normal ainda há espaço
    await http().post('/categorias').set(autorizacao(normal.token)).send({ nome: 'Mais uma' }).expect(201);
  });
});