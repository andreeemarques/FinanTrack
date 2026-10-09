import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  AplicacaoTeste,
  autorizacao,
  criarApp,
  limparBaseDeDados,
  registarUtilizador,
} from './ajudantes';

describe('Conta de demonstração (e2e)', () => {
  let app: AplicacaoTeste;
  const http = () => request(app.getHttpServer());
  const criarDemo = async () => {
    const resposta = await http().post('/demo/sessao').expect(201);
    return { id: resposta.body.utilizador.id as string, token: resposta.body.token as string, corpo: resposta.body };
  };
  // Faz de conta que a conta foi criada há 25 horas
  const envelhecer = (id: string) =>
    app.get(PrismaService).utilizador.update({
      where: { id },
      data: { criadoEm: new Date(Date.now() - 25 * 3_600_000) },
    });

  beforeAll(async () => {
    app = await criarApp();
  });
  beforeEach(async () => {
    process.env.DEMO_ATIVA = 'true';
    await limparBaseDeDados(app);
  });
  afterAll(async () => {
    process.env.DEMO_ATIVA = 'true';
    await app.close();
  });

  it('cria uma sessão com dados de exemplo em todas as áreas', async () => {
    const { token, corpo } = await criarDemo();
    expect(corpo.utilizador.ehDemo).toBe(true);

    const movimentos = await http().get('/movimentos?limite=100').set(autorizacao(token)).expect(200);
    expect(movimentos.body.meta.total).toBeGreaterThan(40);

    const orcamentos = await http().get('/orcamentos').set(autorizacao(token)).expect(200);
    expect(orcamentos.body.orcamentos).toHaveLength(4);

    const objetivos = await http().get('/objetivos').set(autorizacao(token)).expect(200);
    expect(objetivos.body.objetivos).toHaveLength(3);
    for (const objetivo of objetivos.body.objetivos) {
      expect(objetivo.poupadoCentimos).toBeGreaterThan(0);
    }

    const dashboard = await http().get('/resumo/dashboard').set(autorizacao(token)).expect(200);
    expect(dashboard.body.saldoCentimos).toBeGreaterThan(0);
    expect(dashboard.body.evolucaoSaldo).toHaveLength(6);
  });

  it('cada visita recebe uma conta isolada das outras', async () => {
    const a = await criarDemo();
    const b = await criarDemo();
    expect(a.id).not.toBe(b.id);

    const lista = await http().get('/movimentos').set(autorizacao(a.token)).expect(200);
    const movimentoDeA = lista.body.dados[0].id as string;

    await http().get(`/movimentos/${movimentoDeA}`).set(autorizacao(b.token)).expect(404);
  });

  it('apaga as contas de demonstração com mais de 24 horas, e só essas', async () => {
    const prisma = app.get(PrismaService);
    const antiga = await criarDemo();
    const normal = await registarUtilizador(app, 'Ana', 'ana@example.com');
    await envelhecer(antiga.id);
    await envelhecer(normal.id); // uma conta normal igualmente antiga não pode ser apagada

    const nova = await criarDemo();

    await http().get('/autenticacao/eu').set(autorizacao(antiga.token)).expect(401);
    expect(await prisma.movimento.count({ where: { utilizadorId: antiga.id } })).toBe(0);
    await http().get('/autenticacao/eu').set(autorizacao(nova.token)).expect(200);
    await http().get('/autenticacao/eu').set(autorizacao(normal.token)).expect(200);
  });

  it('não existe quando está desativada (404)', async () => {
    process.env.DEMO_ATIVA = 'false';
    await http().post('/demo/sessao').expect(404);
  });

  it('recusa criar mais demonstrações quando o limite global é atingido (503)', async () => {
    process.env.DEMO_MAX_ATIVAS = '2';
    try {
      await criarDemo();
      await criarDemo();
      await http().post('/demo/sessao').expect(503);
    } finally {
      delete process.env.DEMO_MAX_ATIVAS;
    }
  });
});