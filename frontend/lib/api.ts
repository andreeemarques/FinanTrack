import type { RespostaAutenticacao } from './tipos'

// A API é acedida através do proxy do Next.js, no próprio site
const URL_API = '/api'

export const EVENTO_SESSAO_EXPIRADA = 'finantrack:sessao-expirada'

// O token de acesso (curto) vive só em memória: nunca em localStorage, onde um script
// malicioso o poderia ler. A sessão longa está num cookie httpOnly, que o JavaScript não lê.
let tokenAcesso: string | null = null

export const obterToken = () => tokenAcesso
export const guardarToken = (token: string) => {
  tokenAcesso = token
}
export const removerToken = () => {
  tokenAcesso = null
}

export class ErroApi extends Error {
  constructor(
    public estado: number,
    mensagem: string,
  ) {
    super(mensagem)
  }
}

async function lerMensagemErro(resposta: Response): Promise<string> {
  try {
    const corpo = (await resposta.json()) as { message?: string | string[] }
    if (Array.isArray(corpo.message)) return corpo.message.join(' ')
    if (corpo.message) return corpo.message
  } catch {
    // a resposta não tinha JSON: usamos a mensagem genérica
  }
  return 'Ocorreu um erro. Tenta novamente.'
}

interface OpcoesPedido {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  corpo?: unknown
}

let renovacaoEmCurso: Promise<RespostaAutenticacao | null> | null = null

// Troca o cookie da sessão por um token de acesso novo. Vários pedidos em simultâneo partilham
// a mesma renovação (o cookie roda a cada uso). Devolve null se não há sessão válida e lança
// um erro se não foi possível contactar o servidor.
export function renovarSessao(): Promise<RespostaAutenticacao | null> {
  if (!renovacaoEmCurso) {
    renovacaoEmCurso = (async () => {
      let resposta: Response
      try {
        resposta = await fetch(`${URL_API}/autenticacao/renovar`, { method: 'POST' })
      } catch {
        throw new ErroApi(0, 'Não foi possível contactar o servidor.')
      }
      if (resposta.status === 401) return null
      if (!resposta.ok) throw new ErroApi(resposta.status, await lerMensagemErro(resposta))

      const dados = (await resposta.json()) as RespostaAutenticacao
      guardarToken(dados.token)
      return dados
    })().finally(() => {
      renovacaoEmCurso = null
    })
  }
  return renovacaoEmCurso
}

export async function pedido<T>(
  caminho: string,
  opcoes: OpcoesPedido = {},
  jaRenovou = false,
): Promise<T> {
  const token = obterToken()
  const cabecalhos: Record<string, string> = {}
  if (opcoes.corpo !== undefined) cabecalhos['Content-Type'] = 'application/json'
  if (token) cabecalhos.Authorization = `Bearer ${token}`

  let resposta: Response
  try {
    resposta = await fetch(`${URL_API}${caminho}`, {
      method: opcoes.metodo ?? 'GET',
      headers: cabecalhos,
      body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
    })
  } catch {
    throw new ErroApi(0, 'Não foi possível contactar o servidor.')
  }

  // O token de acesso dura 15 minutos: se expirou, renova a sessão e repete o pedido uma vez
  if (resposta.status === 401 && token && !jaRenovou) {
    let renovada: RespostaAutenticacao | null
    try {
      renovada = await renovarSessao()
    } catch {
      throw new ErroApi(0, 'Não foi possível contactar o servidor.')
    }
    if (renovada) return pedido<T>(caminho, opcoes, true)

    // Sem sessão válida: termina a sessão
    removerToken()
    window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA))
  }

  if (resposta.status === 429) {
    throw new ErroApi(429, 'Demasiados pedidos. Tenta novamente dentro de instantes.')
  }

  if (!resposta.ok) {
    throw new ErroApi(resposta.status, await lerMensagemErro(resposta))
  }

  if (resposta.status === 204) return undefined as T
  return (await resposta.json()) as T
}