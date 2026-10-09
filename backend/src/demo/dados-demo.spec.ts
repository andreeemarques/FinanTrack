import { CATEGORIAS_PADRAO } from '../autenticacao/categorias-padrao';
import { gerarDadosDemo } from './dados-demo';
import { LIMITES } from '../comum/limites';

const hoje = new Date('2026-10-02T12:00:00.000Z');

describe('gerarDadosDemo', () => {
  const dados = gerarDadosDemo(hoje);

  it('gera movimentos dos últimos 6 meses e nunca no futuro', () => {
    const datas = dados.movimentos.map((m) => m.data).sort();
    expect(datas[0] >= '2026-05-01').toBe(true);
    expect(datas[datas.length - 1] <= '2026-10-02').toBe(true);
    expect(dados.movimentos.length).toBeGreaterThan(40);
  });

  it('só usa categorias padrão e valores inteiros positivos', () => {
    for (const m of dados.movimentos) {
      expect(CATEGORIAS_PADRAO).toContain(m.categoria);
      expect(Number.isInteger(m.valorCentimos) && m.valorCentimos > 0).toBe(true);
    }
    for (const o of dados.orcamentos) {
      expect(CATEGORIAS_PADRAO).toContain(o.categoria);
    }
  });

  it('inclui receitas e despesas, e não repete categorias nos orçamentos', () => {
    expect(new Set(dados.movimentos.map((m) => m.tipo))).toEqual(new Set(['RECEITA', 'DESPESA']));
    const categorias = dados.orcamentos.map((o) => o.categoria);
    expect(new Set(categorias).size).toBe(categorias.length);
  });

  it('as contribuições dos objetivos nunca ficam no futuro', () => {
    for (const objetivo of dados.objetivos) {
      expect(objetivo.contribuicoes.length).toBeGreaterThan(0);
      for (const c of objetivo.contribuicoes) {
        expect(c.data <= '2026-10-02').toBe(true);
      }
    }
  });

  it('funciona em qualquer dia do mês, incluindo o dia 1', () => {
    const primeiro = gerarDadosDemo(new Date('2026-10-01T00:00:00.000Z'));
    expect(primeiro.movimentos.every((m) => m.data <= '2026-10-01')).toBe(true);
  });

  it('cabe nos limites de uma conta de demonstração', () => {
    const contribuicoes = dados.objetivos.reduce((total, o) => total + o.contribuicoes.length, 0);

    expect(dados.movimentos.length).toBeLessThan(LIMITES.demo.movimentos);
    expect(CATEGORIAS_PADRAO.length).toBeLessThan(LIMITES.demo.categorias);
    expect(dados.orcamentos.length).toBeLessThan(LIMITES.demo.orcamentos);
    expect(dados.objetivos.length).toBeLessThan(LIMITES.demo.objetivos);
    expect(contribuicoes).toBeLessThan(LIMITES.demo.contribuicoes);
  });
});