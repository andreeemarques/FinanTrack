import request from 'supertest';
import {
  AplicacaoTeste,
  autorizacao,
  criarApp,
  limparBaseDeDados,
  registarUtilizador,
} from './ajudantes';

describe('Isolamento entre utilizadores (e2e)', () => {
  let app: AplicacaoTeste;
  let a: { token: string };
  let b: { token: string };
  const ids = { categoria: '', movimento: '', orcamento: '', objetivo: '', contribuicao: '' };
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await criarApp();
    await limparBaseDeDados(app);
    a = await registarUtilizador(app, 'Ana', 'ana@example.com');
    b = await registarUtilizador(app, 'Rui', 'rui@example.com');

    // A cria dados em todas as áreas
    const categorias = await http().get('/categorias').set(autorizacao(a.token)).expect(200);
    ids.categoria = categorias.body[0].id;

    const movimento = await http()
      .post('/movimentos')
      .set(autorizacao(a.token))
      .send({
        tipo: 'DESPESA',
        valorCentimos: 1000,
        data: '2026-10-01',
        descricao: 'Despesa da Ana',
        metodoPagamento: 'CARTAO',
        categoriaId: ids.categoria,
      })
      .expect(201);
    ids.movimento = movimento.body.id;

    const orcamento = await http()
      .post('/orcamentos')
      .set(autorizacao(a.token))
      .send({ categoriaId: ids.categoria, limiteCentimos: 50000, mes: '2026-10' })
      .expect(201);
    ids.orcamento = orcamento.body.id;

    const objetivo = await http()
      .post('/objetivos')
      .set(autorizacao(a.token))
      .send({ nome: 'Objetivo da Ana', metaCentimos: 100000 })
      .expect(201);
    ids.objetivo = objetivo.body.id;

    const contribuicao = await http()
      .post(`/objetivos/${ids.objetivo}/contribuicoes`)
      .set(autorizacao(a.token))
      .send({ valorCentimos: 5000 })
      .expect(201);
    ids.contribuicao = contribuicao.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  const cenarios: {
    nome: string;
    metodo: 'get' | 'post' | 'patch' | 'delete';
    caminho: () => string;
    corpo?: object;
  }[] = [
    { nome: 'ver um movimento de outro utilizador', metodo: 'get', caminho: () => `/movimentos/${ids.movimento}` },
    { nome: 'editar um movimento de outro utilizador', metodo: 'patch', caminho: () => `/movimentos/${ids.movimento}`, corpo: { valorCentimos: 1 } },
    { nome: 'apagar um movimento de outro utilizador', metodo: 'delete', caminho: () => `/movimentos/${ids.movimento}` },
    { nome: 'editar uma categoria de outro utilizador', metodo: 'patch', caminho: () => `/categorias/${ids.categoria}`, corpo: { nome: 'Hack' } },
    { nome: 'apagar uma categoria de outro utilizador', metodo: 'delete', caminho: () => `/categorias/${ids.categoria}` },
    { nome: 'editar um orçamento de outro utilizador', metodo: 'patch', caminho: () => `/orcamentos/${ids.orcamento}`, corpo: { limiteCentimos: 1 } },
    { nome: 'apagar um orçamento de outro utilizador', metodo: 'delete', caminho: () => `/orcamentos/${ids.orcamento}` },
    { nome: 'editar um objetivo de outro utilizador', metodo: 'patch', caminho: () => `/objetivos/${ids.objetivo}`, corpo: { nome: 'Hack' } },
    { nome: 'apagar um objetivo de outro utilizador', metodo: 'delete', caminho: () => `/objetivos/${ids.objetivo}` },
    { nome: 'ver as contribuições de outro utilizador', metodo: 'get', caminho: () => `/objetivos/${ids.objetivo}/contribuicoes` },
    { nome: 'adicionar uma contribuição ao objetivo de outro utilizador', metodo: 'post', caminho: () => `/objetivos/${ids.objetivo}/contribuicoes`, corpo: { valorCentimos: 1 } },
    { nome: 'remover uma contribuição de outro utilizador', metodo: 'delete', caminho: () => `/objetivos/${ids.objetivo}/contribuicoes/${ids.contribuicao}` },
  ];

  it.each(cenarios)('B não consegue $nome (404)', async ({ metodo, caminho, corpo }) => {
    const pedido = request(app.getHttpServer())[metodo](caminho()).set(autorizacao(b.token));
    await (corpo ? pedido.send(corpo) : pedido).expect(404);
  });

  it('as listas de B não incluem dados de A', async () => {
    const movimentos = await http().get('/movimentos').set(autorizacao(b.token)).expect(200);
    expect(movimentos.body.meta.total).toBe(0);

    const orcamentos = await http().get('/orcamentos?mes=2026-10').set(autorizacao(b.token)).expect(200);
    expect(orcamentos.body.orcamentos).toHaveLength(0);

    const objetivos = await http().get('/objetivos').set(autorizacao(b.token)).expect(200);
    expect(objetivos.body.objetivos).toHaveLength(0);

    const categorias = await http().get('/categorias').set(autorizacao(b.token)).expect(200);
    expect(categorias.body.map((c: { id: string }) => c.id)).not.toContain(ids.categoria);
  });

  it('B não pode usar a categoria de A', async () => {
    await http()
      .post('/movimentos')
      .set(autorizacao(b.token))
      .send({
        tipo: 'DESPESA',
        valorCentimos: 1000,
        data: '2026-10-01',
        descricao: 'Tentativa',
        metodoPagamento: 'CARTAO',
        categoriaId: ids.categoria,
      })
      .expect(400);

    await http()
      .post('/orcamentos')
      .set(autorizacao(b.token))
      .send({ categoriaId: ids.categoria, limiteCentimos: 1000, mes: '2026-10' })
      .expect(400);
  });

  it('os dados de A ficam intactos depois das tentativas de B', async () => {
    const movimento = await http().get(`/movimentos/${ids.movimento}`).set(autorizacao(a.token)).expect(200);
    expect(movimento.body.valorCentimos).toBe(1000);

    const orcamentos = await http().get('/orcamentos?mes=2026-10').set(autorizacao(a.token)).expect(200);
    expect(orcamentos.body.orcamentos[0].limiteCentimos).toBe(50000);

    const objetivos = await http().get('/objetivos').set(autorizacao(a.token)).expect(200);
    expect(objetivos.body.objetivos[0]).toMatchObject({ nome: 'Objetivo da Ana', poupadoCentimos: 5000 });

    const categorias = await http().get('/categorias').set(autorizacao(a.token)).expect(200);
    expect(categorias.body).toHaveLength(7);
  });

  it.each([
    '/autenticacao/eu',
    '/categorias',
    '/movimentos',
    '/orcamentos',
    '/objetivos',
    '/resumo/dashboard',
    '/resumo/relatorios',
  ])('GET %s sem token dá 401', async (caminho) => {
    await http().get(caminho).expect(401);
  });
});