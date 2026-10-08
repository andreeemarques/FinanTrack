import { preverConclusao } from './previsao';

const hoje = new Date('2026-10-01T00:00:00.000Z');
const haTresMeses = new Date('2026-07-01T00:00:00.000Z');

describe('preverConclusao', () => {
  it('devolve null quando o objetivo já foi atingido', () => {
    expect(preverConclusao(100000, 100000, haTresMeses, hoje)).toBeNull();
    expect(preverConclusao(100000, 150000, haTresMeses, hoje)).toBeNull();
  });

  it('devolve null quando ainda não há contribuições', () => {
    expect(preverConclusao(100000, 0, null, hoje)).toBeNull();
  });

  it('devolve uma data futura quando há ritmo de poupança', () => {
    const previsao = preverConclusao(300000, 100000, haTresMeses, hoje) as string;
    expect(previsao > '2026-10-01').toBe(true);
  });

  it('poupar mais depressa antecipa a previsão', () => {
    const lento = preverConclusao(300000, 50000, haTresMeses, hoje) as string;
    const rapido = preverConclusao(300000, 150000, haTresMeses, hoje) as string;
    expect(rapido < lento).toBe(true);
  });

  it('não faz previsões absurdas (mais de 100 anos)', () => {
    expect(preverConclusao(2_000_000_000, 1, haTresMeses, hoje)).toBeNull();
  });
});