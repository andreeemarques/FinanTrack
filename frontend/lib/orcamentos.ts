import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pedido } from './api'
import type { ResumoOrcamentos } from './tipos'

export function useOrcamentos(mes: string) {
  return useQuery({
    queryKey: ['orcamentos', mes],
    queryFn: () => pedido<ResumoOrcamentos>(`/orcamentos?mes=${mes}`),
    placeholderData: keepPreviousData,
  })
}

function useInvalidarOrcamentos() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['orcamentos'] })
}

export function useCriarOrcamento() {
  const invalidar = useInvalidarOrcamentos()
  return useMutation({
    mutationFn: (dados: { categoriaId: string; limiteCentimos: number; mes: string }) =>
      pedido('/orcamentos', { metodo: 'POST', corpo: dados }),
    onSuccess: invalidar,
  })
}

export function useAtualizarOrcamento() {
  const invalidar = useInvalidarOrcamentos()
  return useMutation({
    mutationFn: ({ id, limiteCentimos }: { id: string; limiteCentimos: number }) =>
      pedido(`/orcamentos/${id}`, { metodo: 'PATCH', corpo: { limiteCentimos } }),
    onSuccess: invalidar,
  })
}

export function useApagarOrcamento() {
  const invalidar = useInvalidarOrcamentos()
  return useMutation({
    mutationFn: (id: string) => pedido<void>(`/orcamentos/${id}`, { metodo: 'DELETE' }),
    onSuccess: invalidar,
  })
}