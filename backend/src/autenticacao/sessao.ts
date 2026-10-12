import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';

export const NOME_COOKIE_SESSAO = 'finantrack_sessao';
export const DURACAO_SESSAO_MS = 30 * 24 * 60 * 60 * 1000;

// Dois pedidos simultâneos com o mesmo cookie (por exemplo, dois separadores) são legítimos:
// só se considera reutilização suspeita passado este tempo desde a troca
export const TOLERANCIA_ROTACAO_MS = 10_000;

// Os tokens já trocados guardam-se mais algum tempo para detetar reutilizações
export const RETENCAO_ROTADAS_MS = 24 * 60 * 60 * 1000;

// Caminho visto pelo browser: a API é acedida através do proxy do frontend, em /api
const CAMINHO_COOKIE = '/api/autenticacao';

export function gerarRefreshToken() {
  return randomBytes(32).toString('base64url');
}

// O token tem entropia de sobra, por isso um hash rápido chega (não é uma password)
export function hashRefresh(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

const opcoesCookie = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: CAMINHO_COOKIE,
});

export function definirCookieSessao(resposta: Response, refreshToken: string) {
  resposta.cookie(NOME_COOKIE_SESSAO, refreshToken, {
    ...opcoesCookie(),
    maxAge: DURACAO_SESSAO_MS,
  });
}

export function limparCookieSessao(resposta: Response) {
  resposta.clearCookie(NOME_COOKIE_SESSAO, opcoesCookie());
}

export function lerCookieSessao(pedido: Request): string | undefined {
  const cabecalho = pedido.headers.cookie;
  if (!cabecalho) return undefined;

  for (const parte of cabecalho.split(';')) {
    const [chave, ...resto] = parte.trim().split('=');
    if (chave !== NOME_COOKIE_SESSAO) continue;
    try {
      return decodeURIComponent(resto.join('='));
    } catch {
      return undefined; // cookie malformado
    }
  }
  return undefined;
}