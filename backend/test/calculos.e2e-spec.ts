import request from 'supertest';
import {
  AplicacaoTeste,
  autorizacao,
  criarApp,
  limparBaseDeDados,
  registarUtilizador,
} from './ajudantes';

describe('Cálculos de resumo e orçamentos (e2e)', () => {
  let app: AplicacaoTeste;
  let token: string;
  let categoriaId: string;
  const http = () => request(app.getHttpServer());

  const criarMovimento = (tipo: 'RECEITA' | 'DESPESA', valorCentimos: number, data: string) =>
    http()
      .post('/movimentos')
      .set(autorizacao(token))
      .send({ tipo, valorCentimos, data, descricao: `${tipo} ${data}`, metodoPagamento: 'CARTAO', categoriaId })
      .expect(201);

  beforeAll(async () => {
    app = await criarApp();
    await limparBaseDeDados(app);
    ({ token } = await registarUtilizador(app, 'Ana', 'ana@example.com'));

    const categorias = await http().get('/categorias').set(autorizacao(token)).expect(200);
    categoriaId = categorias.body[0].id;

    await criarMovimento('RECEITA', 200000, '2026-08-31'); // último dia de agosto
    await criarMovimento('DESPESA', 50000, '2026-09-30'); // último dia de setembro
    await criarMovimento('DESPESA', 30000, '2026-10-01'); // primeiro dia de outubro
    await criarMovimento('RECEITA', 100000, '2026-10-31'); // último dia de outubro
    await criarMovimento('DESPESA', 99999, '2026-11-01'); // novembro: não conta em outubro
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Dashboard', () => {
    it('calcula os totais de outubro sem misturar meses vizinhos', async () => {
      const { body } = await http().get('/resumo/dashboard?mes=2026-10').set(autorizacao(token)).expect(200);

      expect(body.receitasCentimos).toBe(100000);
      expect(body.despesasCentimos).toBe(30000);
      // 200000 - 50000 - 30000 + 100000 (a despesa de novembro não entra)
      expect(body.saldoCentimos).toBe(220000);
    });

    it('calcula as variações face ao mês anterior', async () => {
      const { body } = await http().get('/resumo/dashboard?mes=2026-10').set(autorizacao(token)).expect(200);

      expect(body.variacoes.receitas).toBeNull(); // setembro não teve receitas
      expect(body.variacoes.despesas).toBe(-40); // 30000 face a 50000
      expect(body.variacoes.saldo).toBe(46.7); // 220000 face a 150000
    });

    it('devolve a evolução do saldo dos últimos 6 meses, com saldo acumulado', async () => {
      const { body } = await http().get('/resumo/dashboard?mes=2026-10').set(autorizacao(token)).expect(200);

      expect(body.evolucaoSaldo).toEqual([
        { mes: '2026-05', saldoCentimos: 0 },
        { mes: '2026-06', saldoCentimos: 0 },
        { mes: '2026-07', saldoCentimos: 0 },
        { mes: '2026-08', saldoCentimos: 200000 },
        { mes: '2026-09', saldoCentimos: 150000 },
        { mes: '2026-10', saldoCentimos: 220000 },
      ]);
    });

    it('agrupa as despesas do mês por categoria', async () => {
      const { body } = await http().get('/resumo/dashboard?mes=2026-10').set(autorizacao(token)).expect(200);

      expect(body.despesasPorCategoria).toHaveLength(1);
      expect(body.despesasPorCategoria[0]).toMatchObject({
        valorCentimos: 30000,
        percentagem: 100,
      });
      expect(body.despesasPorCategoria[0].categoria.id).toBe(categoriaId);
    });

    it('um mês sem movimentos devolve zeros e variações nulas', async () => {
      const { body } = await http().get('/resumo/dashboard?mes=2026-02').set(autorizacao(token)).expect(200);

      expect(body).toMatchObject({ receitasCentimos: 0, despesasCentimos: 0, saldoCentimos: 0 });
      expect(body.despesasPorCategoria).toEqual([]);
      expect(body.variacoes.despesas).toBeNull();
    });

    it('recusa um mês inválido (400)', async () => {
      await http().get('/resumo/dashboard?mes=2026-13').set(autorizacao(token)).expect(400);
    });
  });

  describe('Orçamentos', () => {
    it('calcula o gasto só com as despesas do mês', async () => {
      await http()
        .post('/orcamentos')
        .set(autorizacao(token))
        .send({ categoriaId, limiteCentimos: 100000, mes: '2026-10' })
        .expect(201);

      const { body } = await http().get('/orcamentos?mes=2026-10').set(autorizacao(token)).expect(200);

      expect(body.orcamentos).toHaveLength(1);
      expect(body.orcamentos[0]).toMatchObject({
        limiteCentimos: 100000,
        gastoCentimos: 30000,
        restanteCentimos: 70000,
      });
      expect(body.totais).toEqual({ limiteCentimos: 100000, gastoCentimos: 30000, disponivelCentimos: 70000 });
    });

    it('recusa um segundo orçamento para a mesma categoria e mês (409)', async () => {
      await http()
        .post('/orcamentos')
        .set(autorizacao(token))
        .send({ categoriaId, limiteCentimos: 5000, mes: '2026-10' })
        .expect(409);
    });

    it('o restante fica negativo quando o limite é ultrapassado', async () => {
      await http()
        .post('/orcamentos')
        .set(autorizacao(token))
        .send({ categoriaId, limiteCentimos: 20000, mes: '2026-09' })
        .expect(201);

      const { body } = await http().get('/orcamentos?mes=2026-09').set(autorizacao(token)).expect(200);

      expect(body.orcamentos[0]).toMatchObject({ gastoCentimos: 50000, restanteCentimos: -30000 });
    });
  });

  describe('Relatórios', () => {
    it('devolve 6 meses por omissão e os meses do ano com periodo=ano', async () => {
      const seis = await http().get('/resumo/relatorios').set(autorizacao(token)).expect(200);
      expect(seis.body.mensal).toHaveLength(6);
      expect(seis.body.periodo.meses).toBe(6);

      const ano = await http().get('/resumo/relatorios?periodo=ano').set(autorizacao(token)).expect(200);
      expect(ano.body.mensal).toHaveLength(new Date().getUTCMonth() + 1);
    });

    it('recusa um período desconhecido (400)', async () => {
      await http().get('/resumo/relatorios?periodo=semana').set(autorizacao(token)).expect(400);
    });

    it('um utilizador sem movimentos tem valores vazios, e não erros', async () => {
      const { token: novo } = await registarUtilizador(app, 'Rui', 'rui@example.com');

      const { body } = await http().get('/resumo/relatorios').set(autorizacao(novo)).expect(200);

      expect(body.mediaMensalDespesasCentimos).toBe(0);
      expect(body.maiorCategoria).toBeNull();
      expect(body.taxaPoupancaPercentagem).toBeNull();
    });
  });
});