'use client'

import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { EVENTO_SESSAO_EXPIRADA, guardarToken, pedido, removerToken, renovarSessao } from './api'
import type { RespostaAutenticacao, Utilizador } from './tipos'

interface ContextoAutenticacao {
  utilizador: Utilizador | null
  carregando: boolean
  entrar: (email: string, password: string) => Promise<void>
  registar: (nome: string, email: string, password: string) => Promise<void>
  entrarDemo: () => Promise<void>
  sair: () => void
  atualizarUtilizador: (utilizador: Utilizador) => void
}

const Contexto = createContext<ContextoAutenticacao | null>(null)

export function AutenticacaoProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [utilizador, setUtilizador] = useState<Utilizador | null>(null)
  const [carregando, setCarregando] = useState(true)

  // Ao abrir a aplicação, o cookie da sessão é trocado por um token de acesso
  useEffect(() => {
    try {
      // Versões antigas guardavam o token no localStorage: remove-o
      localStorage.removeItem('finantrack_token')
    } catch {
      // o armazenamento pode estar indisponível
    }

    renovarSessao()
      .then((resposta) => {
        if (resposta) setUtilizador(resposta.utilizador)
      })
      .catch(() => undefined)
      .finally(() => setCarregando(false))
  }, [])

  // Sessão expirada noutro pedido
  useEffect(() => {
    const aoExpirar = () => {
      setUtilizador(null)
      queryClient.clear()
    }
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar)
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar)
  }, [queryClient])

  const iniciarSessao = useCallback(
    (resposta: RespostaAutenticacao) => {
      guardarToken(resposta.token)
      queryClient.clear()
      setUtilizador(resposta.utilizador)
    },
    [queryClient],
  )

  const entrar = useCallback(
    async (email: string, password: string) => {
      const resposta = await pedido<RespostaAutenticacao>('/autenticacao/entrar', {
        metodo: 'POST',
        corpo: { email, password },
      })
      iniciarSessao(resposta)
    },
    [iniciarSessao],
  )

  const registar = useCallback(
    async (nome: string, email: string, password: string) => {
      const resposta = await pedido<RespostaAutenticacao>('/autenticacao/registar', {
        metodo: 'POST',
        corpo: { nome, email, password },
      })
      iniciarSessao(resposta)
    },
    [iniciarSessao],
  )

  const entrarDemo = useCallback(async () => {
    const resposta = await pedido<RespostaAutenticacao>('/demo/sessao', { metodo: 'POST' })
    iniciarSessao(resposta)
  }, [iniciarSessao])

  const sair = useCallback(() => {
    // Termina a sessão no servidor (revoga-a e apaga o cookie) e limpa o estado local
    pedido<void>('/autenticacao/sair', { metodo: 'POST' }).catch(() => undefined)
    removerToken()
    queryClient.clear()
    setUtilizador(null)
  }, [queryClient])

  const valor = useMemo(
    () => ({ utilizador, carregando, entrar, registar, entrarDemo, sair, atualizarUtilizador: setUtilizador }),
    [utilizador, carregando, entrar, registar, entrarDemo, sair],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useAutenticacao() {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useAutenticacao tem de ser usado dentro do AutenticacaoProvider.')
  return contexto
}