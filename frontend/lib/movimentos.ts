import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pedido } from './api'
import type { DadosMovimento, Movimento, RespostaPaginada, TipoMovimento } from './tipos'

export interface FiltrosMovimentos {
  pagina: number
  limite: number
  tipo?: TipoMovimento
  categoriaId?: string
  pesquisa?: string
}

export function useMovimentos(filtros: FiltrosMovimentos) {
  const parametros = new URLSearchParams()
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== '') parametros.set(chave, String(valor))
  }

  return useQuery({
    queryKey: ['movimentos', filtros],
    queryFn: () => pedido<RespostaPaginada<Movimento>>(`/movimentos?${parametros.toString()}`),
    placeholderData: keepPreviousData, // mantém a página anterior visível enquanto carrega a nova
  })
}

// Cria (sem id) ou edita (com id)
export function useGuardarMovimento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id?: string; dados: DadosMovimento }) =>
      id
        ? pedido<Movimento>(`/movimentos/${id}`, { metodo: 'PATCH', corpo: dados })
        : pedido<Movimento>('/movimentos', { metodo: 'POST', corpo: dados }),
    onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['movimentos'] })
          queryClient.invalidateQueries({ queryKey: ['orcamentos'] })
          queryClient.invalidateQueries({ queryKey: ['resumo'] })
        },
  })
}

export function useApagarMovimento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pedido<void>(`/movimentos/${id}`, { metodo: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentos'] })
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] })
      queryClient.invalidateQueries({ queryKey: ['resumo'] })
    },
  })
}