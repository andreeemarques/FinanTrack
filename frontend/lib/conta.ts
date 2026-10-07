import { useMutation } from '@tanstack/react-query'
import { guardarToken, pedido } from './api'
import { useAutenticacao } from './autenticacao'
import type { Utilizador } from './tipos'

export function useAtualizarPerfil() {
  const { atualizarUtilizador } = useAutenticacao()
  return useMutation({
    mutationFn: (dados: { nome: string; email: string; passwordAtual?: string }) =>
      pedido<Utilizador>('/autenticacao/eu', { metodo: 'PATCH', corpo: dados }),
    onSuccess: atualizarUtilizador,
  })
}

export function useAlterarPassword() {
  return useMutation({
    mutationFn: (dados: { passwordAtual: string; novaPassword: string }) =>
      pedido<{ token: string }>('/autenticacao/alterar-password', { metodo: 'POST', corpo: dados }),
    // As outras sessões ficam inválidas; esta continua com o token novo
    onSuccess: (resposta) => guardarToken(resposta.token),
  })
}

// Depois de apagar, termina a sessão (e o painel redireciona para o login)
export function useApagarConta() {
  const { sair } = useAutenticacao()
  return useMutation({
    mutationFn: (password: string) =>
      pedido<void>('/autenticacao/apagar-conta', { metodo: 'POST', corpo: { password } }),
    onSuccess: sair,
  })
}