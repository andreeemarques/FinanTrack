import { inicioDoMesSeguinte, listarMeses, somarMeses } from './mes';

describe('funções de meses', () => {
  it('somarMeses atravessa a mudança de ano', () => {
    expect(somarMeses('2026-01', -1)).toBe('2025-12');
    expect(somarMeses('2026-12', 1)).toBe('2027-01');
    expect(somarMeses('2026-10', -5)).toBe('2026-05');
    expect(somarMeses('2026-10', 0)).toBe('2026-10');
  });

  it('inicioDoMesSeguinte devolve o dia 1 do mês seguinte (UTC)', () => {
    expect(inicioDoMesSeguinte('2026-02').toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(inicioDoMesSeguinte('2026-12').toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('listarMeses inclui os dois extremos', () => {
    expect(listarMeses('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
    expect(listarMeses('2026-10', '2026-10')).toEqual(['2026-10']);
  });
});