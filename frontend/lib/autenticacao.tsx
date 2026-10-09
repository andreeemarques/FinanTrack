'use client'

import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  EVENTO_SESSAO_EXPIRADA,
  guardarToken,
  obterToken,
  pedido,
  removerToken,
} from './api'
import type { RespostaAutenticacao, Utilizador } from './tipos'

interface ContextoAutenticacao {
  utilizador: Utilizador | null
  carregando: boolean
  entrarDemo: () => Promise<void>
  entrar: (email: string, password: string) => Promise<void>
  registar: (nome: string, email: string, password: string) => Promise<void>
  sair: () => void
  atualizarUtilizador: (utilizador: Utilizador) => void
}

const Contexto = createContext<ContextoAutenticacao | null>(null)

export function AutenticacaoProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [utilizador, setUtilizador] = useState<Utilizador | null>(null)
  const [carregando, setCarregando] = useState(true)

  // Ao abrir a aplicação, se houver token guardado, confirma-o com a API
  useEffect(() => {
    if (!obterToken()) {
      setCarregando(false)
      return
    }
    pedido<Utilizador>('/autenticacao/eu')
      .then(setUtilizador)
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