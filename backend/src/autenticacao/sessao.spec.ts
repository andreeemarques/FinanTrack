import type { Request } from 'express';
import { gerarRefreshToken, hashRefresh, lerCookieSessao } from './sessao';

const pedidoCom = (cookie?: string) => ({ headers: { cookie } }) as Request;

describe('lerCookieSessao', () => {
  it('lê o cookie da sessão no meio de outros', () => {
    expect(lerCookieSessao(pedidoCom('a=1; finantrack_sessao=abc123; b=2'))).toBe('abc123');
  });

  it('devolve undefined sem cookies ou sem o cookie da sessão', () => {
    expect(lerCookieSessao(pedidoCom())).toBeUndefined();
    expect(lerCookieSessao(pedidoCom('a=1; b=2'))).toBeUndefined();
  });

  it('ignora um cookie malformado em vez de rebentar', () => {
    expect(lerCookieSessao(pedidoCom('finantrack_sessao=%E0%A4%A'))).toBeUndefined();
  });

  it('não confunde cookies com nomes parecidos', () => {
    expect(lerCookieSessao(pedidoCom('outra_finantrack_sessao=x'))).toBeUndefined();
  });
});

describe('tokens de sessão', () => {
  it('gera tokens longos e diferentes de cada vez', () => {
    const a = gerarRefreshToken();
    const b = gerarRefreshToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(43);
  });

  it('o hash é estável, hexadecimal e diferente do token', () => {
    const token = gerarRefreshToken();
    expect(hashRefresh(token)).toBe(hashRefresh(token));
    expect(hashRefresh(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashRefresh(token)).not.toBe(token);
  });
});