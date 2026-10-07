const URL_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const CHAVE_TOKEN = 'finantrack_token'

export const EVENTO_SESSAO_EXPIRADA = 'finantrack:sessao-expirada'

export const obterToken = () =>
  typeof window === 'undefined' ? null : localStorage.getItem(CHAVE_TOKEN)
export const guardarToken = (token: string) => localStorage.setItem(CHAVE_TOKEN, token)
export const removerToken = () => localStorage.removeItem(CHAVE_TOKEN)

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

export async function pedido<T>(caminho: string, opcoes: OpcoesPedido = {}): Promise<T> {
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

  // Token expirado ou inválido: termina a sessão
  if (resposta.status === 401 && token) {
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