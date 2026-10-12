import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pedido } from './api'
import type { CategoriaComTotal } from './tipos'

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: () => pedido<CategoriaComTotal[]>('/categorias'),
    staleTime: 5 * 60_000,
  })
}

export interface DadosCategoria {
  nome: string
  cor: string | null
}

// O nome da categoria aparece nos movimentos, orçamentos e resumos, e apagar uma categoria
// apaga também os seus orçamentos: tudo isso tem de ser recarregado
function useInvalidarTudo() {
  const queryClient = useQueryClient()
  return () => {
    for (const chave of ['categorias', 'movimentos', 'orcamentos', 'resumo']) {
      queryClient.invalidateQueries({ queryKey: [chave] })
    }
  }
}

// Cria (sem id) ou edita (com id)
export function useGuardarCategoria() {
  const invalidar = useInvalidarTudo()
  return useMutation({
    mutationFn: ({ id, dados }: { id?: string; dados: DadosCategoria }) =>
      id
        ? pedido<unknown>(`/categorias/${id}`, { metodo: 'PATCH', corpo: dados })
        : pedido<unknown>('/categorias', { metodo: 'POST', corpo: dados }),
    onSuccess: invalidar,
  })
}

export function useApagarCategoria() {
  const invalidar = useInvalidarTudo()
  return useMutation({
    mutationFn: (id: string) => pedido<void>(`/categorias/${id}`, { metodo: 'DELETE' }),
    onSuccess: invalidar,
  })
}